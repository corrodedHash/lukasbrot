import rust from "@wasm-tool/rollup-plugin-rust";

export default {
    input: {
        // foo: "compute/Cargo.toml",
    },
    plugins: [
        rust(),
    ],
};