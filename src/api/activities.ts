import { PulpAPI } from './pulp';

const base = new PulpAPI();

// FIXME HubAPI
export const ActivitiesAPI = {
  listRepo: (id, params?) =>
    base.list(
      `repositories/container/container/${encodeURIComponent(id)}/_content/history/`,
      params,
    ),
};
