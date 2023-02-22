import typescript from "rollup-plugin-typescript2";

const config = [
    {
        input: 'src/Main.ts',
        output: [
            {
                inlineDynamicImports: true,
                file: './dist/index.js',
                format: 'es',
                sourcemap: true,
            }
        ],
        plugins: [
            typescript({
                tsconfig: './tsconfig.json'
            })
        ]
    },
]
export default config;