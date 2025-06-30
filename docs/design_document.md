## Background

Previously, FastGPT's system plugins were tightly coupled with the system, making code contribution quite difficult. Now we are extracting this code to decouple it, and in the future, we can support more modules (not limited to system plugins).

The main objectives are:
1. Decoupling and modularization.
2. FastGPT-plugin can update rapidly, with versions independent of FastGPT
3. Reduce development complexity (no need to run FastGPT environment)
4. Plugin marketplace

Longer-term vision:
1. Build applications in pure code.
2. Add other customizable modules.
3. ...

## Overall Architecture

1. Use `ts-rest` as the RPC framework for interaction, providing SDK for FastGPT main project to call
2. Use `zod` for type validation
3. Use `bun` for compiling each tool into a single `.js` file, supporting hot plugging.

```mermaid
graph LR
A[FastGPT] --> |RESTful API|B[FastGPT-plugin]
B <--> C(Minio)
```

### Project Structure

- **packages**
	- **tool** FastGPT system tools
		- **api** Interface implementation logic
		- **packages** System tools directory (each one is a package)
			- getTime
			- dalle3
			- ...
		- **type** Type definitions
		- **utils** Utilities
- **scripts** Scripts (compilation, creating new tools)
- **sdk**: SDK definitions for external calls, published to npm
- **src**: Runtime, express service
- **test**: Test samples

### System Tool Structure

Refer to [Contributing System Tools]()
