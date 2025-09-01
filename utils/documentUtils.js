// utils/documentUtils.js
import { supabase } from './supabaseClient';

export const deleteDocumentFile = async (filePath) => {
  const { error } = await supabase.storage.from('documents').remove([filePath]);
  if (error) {
    console.error('Error deleting file from Supabase:', error);
    throw error;
  }
};

export function generateCategoryList(documents) {
    const categories = new Set();
    Object.values(documents).forEach((doc) => {
      if (doc.category) {
        categories.add(doc.category);
      }
    });
    return Array.from(categories).sort();
  }
  
  export function getDocumentsByCategory(documents, category) {
    const filtered = {};
    Object.entries(documents).forEach(([id, doc]) => {
      if (doc.category === category) {
        filtered[id] = doc;
      }
    });
    return filtered;
  }
  