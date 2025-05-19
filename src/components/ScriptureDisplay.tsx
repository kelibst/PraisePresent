import React from 'react';
import { Scripture } from '../database/models/bible';

interface ScriptureDisplayProps {
  scripture: Scripture;
  className?: string;
}

const ScriptureDisplay: React.FC<ScriptureDisplayProps> = ({ scripture, className = '' }) => {
  if (!scripture || !scripture.verses || scripture.verses.length === 0) {
    return <p className="text-red-500">No scripture found</p>;
  }

  return (
    <div className={`scripture-display ${className}`}>
      <div className="text-center">
        <h2 className="text-xl uppercase font-bold mb-3">{scripture.reference}</h2>
        
        <div className="text-lg mb-3">
          {scripture.verses.map((verse) => (
            <p key={verse.id} className="mb-2">
              <span className="text-sm text-blue-500 font-medium mr-1">{verse.verse}</span>
              <span>{verse.text}</span>
            </p>
          ))}
        </div>
        
        <span className="text-sm font-medium text-blue-400">{scripture.translation}</span>
      </div>
    </div>
  );
};

export default ScriptureDisplay; 