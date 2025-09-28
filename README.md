# VanityCR

💄 OCI container registry reverse proxy for vanity domains

<table align=center>
<tr><th>Before
<tr><td>

```sh
docker run ghcr.io/octocat/awesomesauce
```

<tr><th>After
<tr><td>

```sh
docker run octocat.example/awesomesauce
```

</table>

✨ Use your own domain name as a facade for any OCI container registry\
💲 Simple enough to fit into most serverless platforms' free tiers

## Installation

👇 These are clickable!<br>
[<img height=32 alt="Deploy to Cloudflare" src="https://deploy.workers.cloudflare.com/button">](https://deploy.workers.cloudflare.com/?url=https://github.com/jcbhmr/vanitycr)
[<img height=32 alt="Deploy on Deno" src="https://deno.com/deploy.svg">](https://console.deno.com/new?clone=https://github.com/jcbhmr/vanitycr)
[<img height=32 alt="Deploy to Netlify" src="https://www.netlify.com/img/deploy/button.svg">](https://app.netlify.com/start/deploy?repository=https://github.com/jcbhmr/vanitycr)
[<img height=32 alt="Deploy with Vercel" src="https://vercel.com/button">](https://vercel.com/new/clone?repository-url=https://github.com/jcbhmr/vanitycr)
[<img height=32 alt="Run on Google Cloud" src="https://deploy.cloud.run/button.svg">](https://deploy.cloud.run?git_repo=https://github.com/jcbhmr/vanitycr)

You can deploy this project with almost zero configuration to [Cloudflare Workers](https://workers.cloudflare.com/), [Deno Deploy](https://deno.com/deploy), [Netlify](https://www.netlify.com/), [Vercel](https://vercel.com/), or [Google Cloud Run](https://cloud.google.com/run). Use the quick deploy buttons above.

If you want to do things manually, use the <kbd>Use this template</kbd> button to create a new repository and follow the instructions for your chosen platform to deploy your new copy of this project to your serverless platform of choice.

After deploying you will probably want to configure which underlying container registry to use and possibly a namespace prefix. Configuration values are sourced from `vanitycr.json` in the root of your project repository or from environment variables. See [the Configuration section](#configuration) for details.

### Docker

You can also run this project on any Docker-compatible platform or your own infrastructure with `docker`.

```sh
docker run --expose 80 cr.jcbhmr.com/vanitycr
```

You can set environment variables, mount `/app/vanitycr.json`, or provide CLI arguments to configure the app.

### Run JavaScript directly

This app consists only of a JavaScript HTTP server. No session state, no DBs, no WebSockets. As such, it's published as a standalone executable npm package.

```sh
npx vanitycr
deno npm:vanitycr
bunx vanitycr
```

You can set environment variables, create a `~/.config/vanitycr.json` file, or provide CLI arguments to configure the app.

## Usage

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=Docker&logoColor=FFFFFF)
![Podman](https://img.shields.io/badge/Podman-892CA0?style=for-the-badge&logo=Podman&logoColor=FFFFFF)
![Open Containers Initiative](https://img.shields.io/badge/Open%20Containers%20Initiative-262261?style=for-the-badge&logo=Open+Containers+Initiative&logoColor=FFFFFF)

Once deployed, you can use your vanity domain to interact with images from the underlying
container registry.

```sh
docker run octocat.example/awesomesauce
docker push octocat.example/coolapp:1.2.3
```

### Configuration

You may specify configuration in any of the following ways in increasing order of precedence:

1. A `vanitycr.json` file in the root of your project repository
2. A `~/.config/vanitycr.json` file in the home directory of the user running the app
3. Environment variables
4. Command line arguments

Configuration names are `--kebab-case` on the command line, `camelCase` in JSON, and `SCREAMING_SNAKE_CASE` in environment variables.

- **`ociRootURL`/`OCI_ROOT_URL`/`--oci-root-url`:** The base URL of the underlying container registry. This
  includes the `http://` or `https://` scheme prefix in addition to the hostname
  and port.

  Examples:
  - `https://registry-1.docker.io` (Docker Hub) \[Default\]
  - `https://ghcr.io` (GitHub Container Registry)
  - `https://registry.gitlab.com` (GitLab Container Registry)
  - `https://gcr.io` (Google Container Registry)
  - `https://quay.io` (Quay)

  Scheme must be `https` when using a public URL. `http` is only supported for
  local URLs (`localhost`, `127.0.0.1`, etc.).

  Defaults to `https://registry-1.docker.io` (Docker Hub). It's recommended to
  set this explicitly.

- **`ociNamespace`/`OCI_NAMESPACE`/`--oci-namespace`:** An optional namespace to prefix all image names with
  before forwarding requests to the underlying registry.

  Pair this with the right `ociRootURL` to create a vanity domain for a
  specific user or organization using an existing underlying registry. For
  example, setting `OCI_ROOT_URL=https://ghcr.io` and `OCI_NAMESPACE=octocat`
  will make `octocat.example/awesomesauce` actually fetch from
  `ghcr.io/octocat/awesomesauce`.

  Defaults to _unset_ (no prefixing). This default is rarely useful since most
  vanity domains will want to point to a specific user or organization.

## Development

![Node.js](https://img.shields.io/badge/Node.js-5FA04E?style=for-the-badge&logo=Node.js&logoColor=FFFFFF)
![Hono](https://img.shields.io/badge/Hono-E36002?style=for-the-badge&logo=Hono&logoColor=FFFFFF)
![Zod](https://img.shields.io/badge/Zod-408AFF?style=for-the-badge&logo=Zod&logoColor=FFFFFF)

This project uses [Hono](https://hono.dev/).

The environment variable names are inspired by the
[OCI conformance test](https://github.com/opencontainers/distribution-spec/tree/main/conformance)
environment variable names. `NODE_PORT`/`PORT` is what
[Bun uses by default to determine which port to listen on](https://bun.com/docs/api/http#changing-the-port-and-hostname)
and seems to be the Node.js convention.

Run `npm run generate` every time you change the `*.pegjs` files to regenerate the PeggyJS parser code & types.
