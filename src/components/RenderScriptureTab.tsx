import { mockServiceItems, mockSongs } from "@/db/mockDb";
import { Scripture } from "@/database/models/bible";
import ScriptureList from "./ScriptureList";
import ScriptureSelector from "./ScriptureSelector";
import ServicePlanList from "./ServicePlanList";
import SongsList, { Song } from "./SongsList";



export const RenderScriptureTab = (activeTab: string,
	currentSlideIndex: number,
	handleScriptureSelect: (scripture: Scripture) => void,
	handleBibleSelect: (bible: string) => void, selectedBible: string,
	handleSongPreview: (song: Song) => void) => {
    switch (activeTab) {
      case 'plan':
        return <ServicePlanList items={mockServiceItems} currentIndex={currentSlideIndex} />;
      case 'scripture':
        return (
          <div className="space-y-5">
            <ScriptureSelector 
              onScriptureSelect={handleScriptureSelect} 
              onBibleSelect={handleBibleSelect}
            />
            
            <ScriptureList 
              bibleId={selectedBible} 
              onScriptureSelect={handleScriptureSelect} 
            />
          </div>
        );
      case 'songs':
        return <SongsList songs={mockSongs} onPreview={handleSongPreview} />;
      default:
        return null;
    }
  };