import preprocess from 'svelte-preprocess';
import awsAdapter from 'sveltekit-adapter-aws';

export default {
	preprocess: preprocess(),
	kit: {
		adapter: awsAdapter.default,
		target: '#svelte'
	}
};
