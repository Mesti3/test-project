import { PulpAPI } from './pulp';

const base = new PulpAPI();

export const DomainAPI = {
  get: (id) => base.http.get(`domains/${id}/`),
  list: (params?) => base.list(`domains/`, params),
};
