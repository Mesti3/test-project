import { PulpAPI } from './pulp';
import { ContainerTagAPI } from './container-tag';

const base = new PulpAPI();

// Use the published Pulp container API resources when available.
// These paths match the API root list you provided, e.g.
// repositories/container/container/ and content/container/manifests/.
export const ExecutionEnvironmentAPI = {
  deleteExecutionEnvironment: (name) =>
    base.http.delete(`repositories/container/container/${encodeURIComponent(name)}/`),

  deleteImage: (name, manifest) =>
    base.http.delete(`content/container/manifests/${encodeURIComponent(manifest)}/`),

  deleteTag: (repositoryName, tag) =>
    ContainerTagAPI.untag(repositoryName, tag),

  get: (id) =>
    base.http.get(`repositories/container/container/${encodeURIComponent(id)}/`),

  image: (name, digest) =>
    base.http.get(`content/container/manifests/${encodeURIComponent(digest)}/`),

  images: (repositoryName, params) =>
    base.list('content/container/manifests/', {
      repository: repositoryName,
      ...params,
    }),

  list: (params?) =>
    base.list('repositories/container/container/', params),

  readme: (name) =>
    base.http.get(
      `repositories/container/container/${encodeURIComponent(name)}/_content/readme/`,
    ),

  saveReadme: (name, readme) =>
    base.http.put(
      `repositories/container/container/${encodeURIComponent(name)}/_content/readme/`,
      readme,
    ),

  tags: (name, params) =>
    base.list(`content/container/tags/`, {
      repository: name,
      ...params,
    }),
};
