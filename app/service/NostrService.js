import { generateSecretKey, getPublicKey, finalizeEvent, verifyEvent, nip19, SimplePool } from 'nostr-tools';
import crypto from 'crypto';

// List of Nostr relays to use
const RELAYS = [
  'wss://relay.damus.io',
  'wss://nostr-pub.wellorder.net',
  'wss://relay.nostr.info',
  'wss://nos.lol'
];

// Initialize a connection pool
const pool = new SimplePool();

// Generate a new private key for the application if not already set
const getApplicationKeys = () => {
  // In production, this should be stored securely in environment variables
    const privateKey = generateSecretKey();
    const publicKey = getPublicKey(privateKey);
    return { privateKey, publicKey };
};

// Publish an article to Nostr network
export const publishArticle = async (articleData) => {
  try {
    const { privateKey, publicKey } = getApplicationKeys();
    
    // Create event object
    let event = {
      kind: 30023, // Long-form content
      pubkey: publicKey,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['d', articleData.articleId], // Unique identifier
        ['title', articleData.title],
        ['published_at', Math.floor(Date.now() / 1000).toString()],
        ['category', articleData.category]
      ],
      content: articleData.content
    };
    
    // Sign the event
    event =  finalizeEvent(event, privateKey)
    verifyEvent(event)

    
    // Publish to relays
    const pubs = pool.publish(RELAYS, event);
    
    // Wait for at least one relay to accept the event
    await Promise.any(pubs.map(pub => pub.catch(e => e)));
    
    // Return the event ID and other relevant info
    return {
      eventId: event.id,
      nip19EventId: nip19.noteEncode(event.id),
      pubkey: publicKey,
      nip19Pubkey: nip19.npubEncode(publicKey)
    };
  } catch (error) {
    console.error('Error publishing to Nostr:', error);
    throw error;
  }
};

// Retrieve an article from Nostr network
export const retrieveArticle = async (articleId) => {
  try {
    // Query events with the specific article ID
    const events = await pool.querySync(RELAYS, {
      kinds: [30023],
      '#d': [articleId]
    });
    
    // Get the most recent event
    if (!events || events.length === 0) {
      return null;
    }
    
    // Sort by created_at (newest first)
    const sortedEvents = events.sort((a, b) => b.created_at - a.created_at);
    const latestEvent = sortedEvents[0];
    
    // Extract title from tags
    const titleTag = latestEvent.tags.find(tag => tag[0] === 'title');
    const title = titleTag ? titleTag[1] : '';
    
    // Extract category from tags
    const categoryTag = latestEvent.tags.find(tag => tag[0] === 'category');
    const category = categoryTag ? categoryTag[1] : '';
    
    return {
      articleId,
      title,
      content: latestEvent.content,
      createdTimestamp: new Date(latestEvent.created_at * 1000),
      category,
      nostrEventId: latestEvent.id,
      nostrPubkey: latestEvent.pubkey
    };
  } catch (error) {
    console.error('Error retrieving from Nostr:', error);
    throw error;
  }
};

// Update an existing article on Nostr
export const updateArticle = async (articleId, updateData) => {
  // For Nostr, updating means publishing a new event with the same identifier
  return await publishArticle({
    articleId,
    ...updateData
  });
};

// Close pool connections when shutting down
export const closeNostrConnections = () => {
  pool.close(RELAYS);
};
