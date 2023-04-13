(async () => {
	const ctx = await require('esbuild').context({
		entryPoints: {
			extension: './src/extension.ts'
		},
		bundle: true,
		outdir: './dist',
		external: ['vscode'],
		format: 'cjs',
		platform: 'node',
		tsconfig: './tsconfig.json',
		define: process.argv.includes('--production') ? { 'process.env.NODE_ENV': '"production"' } : undefined,
		minify: process.argv.includes('--production'),
		sourcemap: !process.argv.includes('--production'),
	});
	if (process.argv.includes('--watch')) {
		await ctx.watch();
		console.log('watching...');
	}
	else {
		await ctx.rebuild();
		await ctx.dispose();
	}
})();
