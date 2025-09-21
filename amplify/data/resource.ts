import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

// The schema definition is the source of truth for your data model.
const schema = a.schema({
  
  // --- Order Model ---
  Order: a
    .model({
      businessId: a.string().required(), 
      orderId: a.string().required(),
      customerPhone: a.string().required(),
      orderDate: a.datetime().required(),
      amount: a.float().required(),
      status: a.enum([
        'ORDERED',
        'IN_PREPARATION',
        'PREPARED',
        'DELIVERED',
        'CANCELLED'
      ]),
      lineItems: a.json().required(),
      // This field is for your business logic (e.g., displaying the agent's name).
      deliveryAgentId: a.string(), 
      // This 'owner' field is specifically for the authorization rule.
      // It should be populated with the deliveryAgentId.
      owner: a.string(),
    })
    .identifier(['businessId', 'orderId'])
    .secondaryIndexes(index => [
      index('customerPhone').sortKeys(['orderDate']).queryField('ordersByCustomer'),
      index('status').sortKeys(['orderDate']).queryField('ordersByStatus'),
      index('deliveryAgentId').sortKeys(['orderDate']).queryField('ordersByDeliveryAgent')
    ])
    // --- Corrected Multi-Level Authorization Rules ---
    .authorization(allow => [
      // Rule 1: Business Owners have full control.
      allow.groups(['BusinessOwners']).to(['create', 'read', 'update', 'delete']),
      
      // Rule 2: The owner of the order (the agent) can read and update the order.
      // NOTE: A more granular field-level update rule was causing a syntax error.
      // This broader rule is compatible but will generate a security warning on deploy.
      allow.owner().to(['read', 'update']),

      // Rule 3: Any other signed-in user (like the AI Agent) can only create orders.
      allow.authenticated().to(['create']),
    ]),

  // --- Customer Model ---
  Customer: a
    .model({
      customerPhone: a.string().required(),
      customerName: a.string().required(),
    })
    .identifier(['customerPhone'])
    .authorization(allow => [
      allow.groups(['BusinessOwners']).to(['read', 'create', 'update', 'delete'])
    ]),

  // --- DeliveryAgent Model ---
  DeliveryAgent: a
    .model({
      // The agent's user ID (from Cognito) is their unique identifier for business logic.
      agentId: a.string().required(),
      agentName: a.string().required(),
      // This 'owner' field is for the authorization rule.
      // It should be populated with the agentId.
      owner: a.string(),
    })
    .identifier(['agentId'])
    .authorization(allow => [
      // Business Owners can manage the list of agents.
      allow.groups(['BusinessOwners']).to(['read', 'create', 'update', 'delete']),
      // An agent can read their own record in the agent list.
      allow.owner().to(['read']),
    ]),
});

// Export the schema and define authorization modes
export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});

