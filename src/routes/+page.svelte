<script lang="ts">
	import { Marked } from 'marked';
	import markedFootnote from 'marked-footnote';
	import { onMount } from 'svelte';

	const markdownParser = new Marked().use(markedFootnote());
	let search_query = $state('');
	let num_results = $state(10);
	let chat_answers = $state('# Enter your question below:');
	let works = $state([]);
	let selectedWorks = $state([]);

	type Verse = {
		id: string;
		bookName: string;
		chapter: string;
		chapterName: string;
		chapterSummary: string;
		chapterSlug: string;
		bookSlug: string;
		workSlug: string;
		number: number;
		text: string;
	};

	onMount(async () => {
		let results = await fetch('/api/work');

		let resultData = await results.json();

		works = resultData.works;

		selectedWorks = works.map((work) => work.id);
	});

	async function getScriptures(e: Event) {
		e.preventDefault();
		try {
			chat_answers = '# Finding relevant passages... \n\n';
			let searchResponse = await fetch('/api/ai', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					query: search_query,
					num_results: num_results,
					selected_works: selectedWorks
				})
			});

			// code not 200:
			//

			if (!searchResponse.ok) {
				throw new Error(`HTTP error: status: ${searchResponse.status}`);
			}

			const searchData = await searchResponse.json();

			// create new array by grouping verses by chapter and then sort by verse number

			const groupedVerses = searchData.verses.reduce((acc: [], verse: Verse) => {
				const key = `${verse.bookName} ${verse.chapterName}`;
				if (!acc[key]) acc[key] = [];
				acc[key].push(verse);
				return acc;
			}, {});

			const sortedVerses = Object.values(groupedVerses).map((chapterVerses) => {
				return chapterVerses.sort((a, b) => a.number - b.number);
			});

			let new_answers = '# ' + search_query + '\n\n';

			for (let i = 0; i < sortedVerses.length; i++) {
				const verses = sortedVerses[i];
				const numbers = verses.map((verse: Verse) => verse.number).join(',');
				new_answers += '---\n\n## ' + verses[0].bookName + ' ' + verses[0].chapterName + '\n\n';

				new_answers += '*' + verses[0].chapterSummary + '*\n\n';
				for (let j = 0; j < verses.length; j++) {
					new_answers += `${verses[j].content.replace(/\[\^.*?\]/g, '')}\n\n`;
				}
				console.log(numbers);
				console.log(verses[0].number - 1);
				console.log(verses[0]);
				new_answers +=
					'<a href="https://www.churchofjesuschrist.org/study/' +
					verses[0].workSlug +
					'/' +
					verses[0].bookSlug +
					'/' +
					verses[0].chapterSlug +
					(verses[0].workSlug.includes('general-conference') ? '' : '&id=p' + numbers) +
					'#p' +
					(verses[0].number - 1) +
					'" target="_blank">View on ChurchOfJesusChrist.org</a>\n\n';
				new_answers += '\n\n';
			}
			chat_answers = new_answers;
			search_query = '';
		} catch (error) {
			console.error(error);
			chat_answers = '# Error fetching verses';
		}
	}
</script>

<div class="flex flex-col sm:flex-row justify-around">
	<div class="flex flex-col gap-8 p-8 sm:p-32">
		<div class="flex flex-col gap-2">
			{#each works as work (work.id)}
				<label class="flex flex-row gap-2">
					<input type="checkbox" value={work.id} bind:group={selectedWorks} />
					{work.name}
				</label>
			{/each}
		</div>
	</div>
	<div class="flex flex-col items-center justify-between h-screen">
		<div class="prose py-8 hidden sm:block">
			<h1>Scripture Finder</h1>
		</div>
		<div class="prose h-full overflow-auto py-8 px-8">
			{@html markdownParser.parse(chat_answers)}
		</div>
		<form
			onsubmit={getScriptures}
			class="flex flex-col sm:flex-row gap-4 justify-self-end py-8 max-w-full px-8"
		>
			<input
				bind:value={search_query}
				name="search_query"
				placeholder="Enter question here... (example: What is faith?)"
				class="input w-xl max-w-full shrink"
				required
			/>
			<div class="flex flex-col gap-2">
				<label class="input w-full sm:w-52" for="num_results">
					<input
						type="number"
						bind:value={num_results}
						min="1"
						max="1000"
						name="num_results"
						required
					/>
					<span class="label">results</span>
				</label>
			</div>

			<button type="submit" class="btn btn-primary">Search</button>
		</form>
	</div>
	<div></div>
</div>
