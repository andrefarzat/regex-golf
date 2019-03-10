const path = require('path');

module.exports = {
    devtool: 'inline-source-map',
    mode: 'development',
    entry: './src/app/index.ts',
    output: {
        path: path.resolve(__dirname, 'src', 'app', 'public'),
        filename: 'bundle.js'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    module: {
        rules: [
            { test: /\.tsx?$/, use: 'ts-loader' },
            { test: /\.txt$/, use: 'raw-loader' },
        ]
    },
    node: {
        fs: 'empty',
        child_process: 'empty',
    },
    // externals: { vue: 'Vue' }
};
