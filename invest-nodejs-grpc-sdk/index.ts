require('react');
require('graphql');
require('lodash');
require('subscriptions-transport-ws');

const { generateApolloClient } = require("@deep-foundation/hasura/client");
const { DeepClient } = require('@deep-foundation/deeplinks/imports/client');
const { minilinks, Link } = require('@deep-foundation/deeplinks/imports/minilinks');

const apolloClient = generateApolloClient({
  path: '3006-deepfoundation-dev-trklra2bj6y.ws-eu43.gitpod.io', // <<= HERE PATH TO UPDATE
  ssl: true,
  // admin token in prealpha deep secret key
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWFsbG93ZWQtcm9sZXMiOlsibGluayJdLCJ4LWhhc3VyYS1kZWZhdWx0LXJvbGUiOiJsaW5rIiwieC1oYXN1cmEtdXNlci1pZCI6IjIwNiJ9LCJpYXQiOjE2NDg0MDkzODV9.aiMZAI65NGEWwERsj1qdimHZcqkuaSLHBR8nGo8n2Nk',
});
const deep = new DeepClient({ apolloClient, linkId: 206 });

const actualUserId = deep.linkId; // actualUserId
console.log(actualUserId);