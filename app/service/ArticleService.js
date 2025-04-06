import ArticlesModel from '../model/Article.js';
import * as NostrService from './NostrService.js';

export const save = async (articleData) => {
  try {
    // Publish to Nostr first
    const nostrResult = await NostrService.publishArticle(articleData);
    
    // Add Nostr metadata to article data
    const enrichedData = {
      ...articleData,
      nostrEventId: nostrResult.eventId,
      nostrNip19EventId: nostrResult.nip19EventId,
      nostrPubkey: nostrResult.pubkey
    };
    
    // Save to MongoDB
    const article = new ArticlesModel(enrichedData);
    return await article.save();
  } catch (error) {
    throw error;
  }
};

export const get = async (articleId) => {
  try {
    // Get from MongoDB
    const article = await ArticlesModel.findOne({ articleId: articleId }).exec();
    
    // Try to get latest version from Nostr if available
    try {
      const nostrArticle = await NostrService.retrieveArticle(articleId);
      if (nostrArticle && article) {
        // Update MongoDB if Nostr has newer content
        if (new Date(nostrArticle.createdTimestamp) > new Date(article.createdTimestamp)) {
          await ArticlesModel.findOneAndUpdate(
            { articleId: articleId },
            { 
              content: nostrArticle.content,
              title: nostrArticle.title,
              nostrEventId: nostrArticle.nostrEventId 
            }
          );
          
          // Return updated article
          return {
            ...article.toObject(),
            content: nostrArticle.content,
            title: nostrArticle.title,
            nostrEventId: nostrArticle.nostrEventId
          };
        }
      }
    } catch (nostrError) {
      console.error("Error retrieving from Nostr, using MongoDB version:", nostrError);
    }
    
    return article;
  } catch (error) {
    throw error;
  }
};

export const getAll = async () => {
  try {
    return await ArticlesModel.find({}).exec();
  } catch (error) {
    throw error;
  }
};

export const updateById = async (articleId, updateData) => {
  try {
    // Only update on Nostr if we're updating content or title
    let enrichedUpdateData = {...updateData};
    
    if (updateData.content || updateData.title) {
      // Get the current article to pass complete data to Nostr
      const currentArticle = await ArticlesModel.findOne({ articleId }).exec();
      if (!currentArticle) {
        throw new Error("Article not found");
      }
      
      // Prepare complete article data for Nostr update
      const articleData = {
        articleId,
        title: updateData.title || currentArticle.title,
        content: updateData.content || currentArticle.content,
        category: currentArticle.category
      };
      
      // Update on Nostr
      const nostrResult = await NostrService.updateArticle(articleId, articleData);
      
      // Add Nostr metadata to update data
      enrichedUpdateData = {
        ...updateData,
        nostrEventId: nostrResult.eventId,
        nostrNip19EventId: nostrResult.nip19EventId
      };
    } else {
      // Skip Nostr update for vote counts and other metadata
      console.log("Skipping Nostr update for non-content changes");
    }
    
    // Update in MongoDB
    return await ArticlesModel.findOneAndUpdate(
      { articleId: articleId },
      enrichedUpdateData,
      { new: true }
    ).exec();
  } catch (error) {
    console.error("Error in updateById:", error);
    throw error;
  }
};

export const deleteById = async (articleId) => {
  try {
    // Note: We don't actually delete from Nostr as data is immutable there
    // We just delete from our MongoDB
    return await ArticlesModel.findOneAndDelete({ articleId: articleId }).exec();
  } catch (error) {
    throw error;
  }
};

