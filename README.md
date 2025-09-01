# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)


## Build
```sh
# 需要解锁 keychain，保证签名生效
/usr/bin/security unlock-keychain ~/Library/Keychains/login.keychain-db

```

## Dev
```sh
TAURI_DEV_HOST=0.0.0.0 yarn tauri ios dev
```
