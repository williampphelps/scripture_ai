<script lang="ts">
	import { Marked } from 'marked';
	import markedFootnote from 'marked-footnote';

	const markdownParser = new Marked().use(markedFootnote());
	let search_query = $state('');
	let num_results = $state(10);
	let model = $state('nomic-embed-text-prefix');
	let chat_answers = $state('# Enter your question below:');

	async function getScriptures(e: Event) {
		e.preventDefault();
		chat_answers = '# Finding relevant verses... \n\n This may take a few seconds...';
		let searchResponse = await fetch('/api/ai', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				query: search_query,
				num_results: num_results,
				model: model
			})
		});
		const searchData = await searchResponse.json();

		console.log(searchData);

		let new_answers = '# ' + search_query + '\n\n';

		for (let i = 0; i < searchData.verses.length; i++) {
			const verse = searchData.verses[i];
			new_answers +=
				'## ' +
				verse.bookName +
				' ' +
				verse.chapterName +
				'\n\n' +
				verse.content.replace(/\[\^.*?\]/g, '') +
				'\n\n' +
				'**' +
				(verse.similarity * 100).toFixed(2) +
				'% Match**\n\n';
		}
		chat_answers = new_answers;
	}
</script>

<div class="flex flex-col items-center justify-between h-screen">
	<div class="prose py-8">
		<h1>Scripture AI</h1>
	</div>
	<div class="prose h-full overflow-auto py-8 px-8">
		{@html markdownParser.parse(chat_answers)}
	</div>
	<form
		onsubmit={getScriptures}
		class="flex flex-col sm:flex-row gap-4 justify-self-end py-8 max-w-full px-8"
	>
		<div class="flex flex-col gap-2">
			<select class="select w-full sm:w-auto" bind:value={model} name="model">
				<option disabled>Select Embedding Model</option>
				<option value="nomic-embed-text-prefix" selected>nomic-embed-text-prefix</option>
				<option value="mxbai-embed-large">mxbai-embed-large</option>
				<option value="nomic-embed-text">nomic-embed-text</option>
				<option value="bge-m3">bge-m3</option>
				<option value="snowflake-arctic-embed">snowflake-arctic-embed</option>
			</select>

			<label class="input w-full sm:w-52" for="num_results">
				<input type="number" bind:value={num_results} min="1" name="num_results" />
				<span class="label">results</span>
			</label>
		</div>

		<input
			bind:value={search_query}
			name="search_query"
			placeholder="Enter question here... (example: What is faith?)"
			class="input w-xl max-w-full shrink"
		/>
		<button type="submit" class="btn btn-primary">Search</button>
	</form>
</div>
