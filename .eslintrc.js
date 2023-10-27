module.exports = {
    env: {
        node: true,
        browser: true
    },

    parser: "@typescript-eslint/parser",

    plugins: ["@typescript-eslint"],

    extends: ["eslint:recommended",
        "plugin:@typescript-eslint/recommended"],

    rules: {
        semi: ["warn", "always"],
        quotes: ["warn", "double"],
        "@typescript-eslint/no-explicit-any": ["warn"]
    }
};