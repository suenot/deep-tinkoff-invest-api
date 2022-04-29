import 'react';
import 'graphql';
import 'lodash';
import 'subscriptions-transport-ws';

import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient } from '@deep-foundation/deeplinks/imports/client';
// import { minilinks, Link } from '@deep-foundation/deeplinks/imports/minilinks';

const apolloClient = generateApolloClient({
  path: '3006-deepfoundation-dev-trklra2bj6y.ws-eu43.gitpod.io/gql', // <<= HERE PATH TO UPDATE
  ssl: true,
  // admin token in prealpha deep secret key
  // token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWFsbG93ZWQtcm9sZXMiOlsibGluayJdLCJ4LWhhc3VyYS1kZWZhdWx0LXJvbGUiOiJsaW5rIiwieC1oYXN1cmEtdXNlci1pZCI6IjIwNiJ9LCJpYXQiOjE2NDg0MDkzODV9.aiMZAI65NGEWwERsj1qdimHZcqkuaSLHBR8nGo8n2Nk',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWFsbG93ZWQtcm9sZXMiOlsibGluayJdLCJ4LWhhc3VyYS1kZWZhdWx0LXJvbGUiOiJsaW5rIiwieC1oYXN1cmEtdXNlci1pZCI6IjIzMiJ9LCJpYXQiOjE2NTEyNTM0Nzd9.IJXiUMmNR7jN7sZyE2BLRHmxPEtBn32DjL_rCu_fSCE'
});
const deep = new DeepClient({ apolloClient, linkId: 206 });

const main = async () => {
  const actualUserId = deep.linkId; // actualUserId
  console.log('actualUserId', actualUserId);
  
  const Type = await deep.id('@deep-foundation/core', 'Type') // Type type link id
  console.log('Type', Type);
  
  const Package = await deep.id('@deep-foundation/core', 'Package') // Package type link Id
  console.log('Package', Package);
  
  const Contain = await deep.id('@deep-foundation/core', 'Contain') // Contain type link id
  console.log('Contain', Contain);
  
  const Any = await deep.id('@deep-foundation/core', 'Any');
  console.log('Any', Any);

  const Value = await deep.id('@deep-foundation/core', 'Value'); // Value type link id
  console.log('Value', Value);

  const String = await deep.id('@deep-foundation/core', 'String'); // String link id - use it as symbol
  console.log('String', String);
}

main()

