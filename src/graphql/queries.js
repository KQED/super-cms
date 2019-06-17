// eslint-disable
// this is an auto generated file. This will be overwritten

export const getSimpleCms = `query GetSimpleCms($id: ID!) {
  getSimpleCms(id: $id) {
    id
    name
    description
  }
}
`;
export const listSimpleCmss = `query ListSimpleCmss(
  $filter: ModelSimpleCmsFilterInput
  $limit: Int
  $nextToken: String
) {
  listSimpleCmss(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      name
      description
    }
    nextToken
  }
}
`;
