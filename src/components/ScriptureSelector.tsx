import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Bible, Scripture } from '../database/models/bible';
import scriptureService from '../services/scriptureService';

interface ScriptureSelectorProps {
  onScriptureSelect: (scripture: Scripture) => void;
}

interface FormValues {
  reference: string;
}

const ScriptureSelector: React.FC<ScriptureSelectorProps> = ({ onScriptureSelect }) => {
  const [bibles, setBibles] = useState<Bible[]>([]);
  const [selectedBible, setSelectedBible] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();

  // Load available Bibles
  useEffect(() => {
    const loadBibles = async () => {
      try {
        const availableBibles = await scriptureService.getAllBibles();
        setBibles(availableBibles);
        
        // Set default Bible to KJV if available
        const kjv = availableBibles.find(bible => bible.id === 'kjv');
        if (kjv) {
          setSelectedBible(kjv.id);
        } else if (availableBibles.length > 0) {
          setSelectedBible(availableBibles[0].id);
        }
      } catch (err) {
        console.error('Failed to load Bibles:', err);
        setError('Failed to load Bible translations');
      }
    };
    
    loadBibles();
  }, []);

  const onSubmit = handleSubmit(async (data: FormValues) => {
    if (!selectedBible) {
      setError('Please select a Bible translation');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Get scripture from service
      const scripture = await scriptureService.getScriptureByReference(
        selectedBible,
        data.reference
      );
      
      if (!scripture) {
        throw new Error('Scripture not found');
      }
      
      onScriptureSelect(scripture);
    } catch (err) {
      console.error('Error fetching scripture:', err);
      setError('Scripture not found. Please check your reference format (e.g., "John 3:16" or "Genesis 1:1-10")');
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Find Scripture</h3>
      
      {error && (
        <div className="mb-3 p-2 bg-red-100 border border-red-300 text-red-800 rounded text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label htmlFor="bible" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Bible Translation
          </label>
          <select
            id="bible"
            value={selectedBible}
            onChange={(e) => setSelectedBible(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {bibles.length === 0 ? (
              <option value="">Loading translations...</option>
            ) : (
              bibles.map((bible) => (
                <option key={bible.id} value={bible.id}>
                  {bible.name}
                </option>
              ))
            )}
          </select>
        </div>
        
        <div className="mb-3">
          <label htmlFor="reference" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Scripture Reference
          </label>
          <input
            id="reference"
            type="text"
            placeholder="e.g., John 3:16 or Genesis 1:1-10"
            className={`w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              errors.reference ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
            }`}
            {...register('reference', { required: 'Scripture reference is required' })}
          />
          {errors.reference && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.reference.message}</p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-70"
        >
          {loading ? 'Searching...' : 'Find Scripture'}
        </button>
      </form>
    </div>
  );
};

export default ScriptureSelector; 