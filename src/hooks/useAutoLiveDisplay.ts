import { useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/store";
import {
  refreshDisplays,
  selectDisplays,
  selectHasMultipleDisplays,
  selectSecondaryDisplay,
  setSelectedLiveDisplay as setDisplaySliceSelectedLiveDisplay,
} from "@/lib/displaySlice";
import {
  setSelectedLiveDisplay as setSettingsSelectedLiveDisplay,
  selectSelectedLiveDisplayId,
} from "@/lib/settingsSlice";
import { setPreviewItem } from "@/lib/presentationSlice";
import { useLiveDisplay } from "./useLiveDisplay";

export const useAutoLiveDisplay = () => {
  const dispatch = useDispatch<AppDispatch>();
  const displays = useSelector(selectDisplays);
  const hasMultipleDisplays = useSelector(selectHasMultipleDisplays);
  const secondaryDisplay = useSelector(selectSecondaryDisplay);
  const selectedLiveDisplayId = useSelector(selectSelectedLiveDisplayId);

  const { createLive, liveDisplayStatus } = useLiveDisplay();

  const setDefaultContent = useCallback(() => {
    // Set the default content as the preview item so it shows in LivePresentation
    const defaultContent = {
      id: 'default-live-display',
      type: 'slide' as const,
      title: 'Welcome to Worship',
      content: 'Preparing for an amazing time of praise and worship',
      reference: 'Your Church Name'
    };

    dispatch(setPreviewItem(defaultContent));
  }, [dispatch]);

  const initializeLiveDisplay = useCallback(async () => {
    console.log("Initializing auto live display...");

    // Set default content first
    setDefaultContent();

    // Refresh displays first
    await dispatch(refreshDisplays());

    // Wait a bit for displays to populate
    setTimeout(async () => {
      const currentDisplays = await dispatch(refreshDisplays()).unwrap();

      if (currentDisplays.length === 0) {
        console.log("No displays detected for auto initialization");
        return;
      }

      // If no live display is selected and we have multiple displays
      if (!selectedLiveDisplayId && hasMultipleDisplays && secondaryDisplay) {
        console.log(
          "Auto-selecting secondary display for live output:",
          secondaryDisplay.friendlyName || secondaryDisplay.label
        );

        // Set the secondary display as the live display
        dispatch(setDisplaySliceSelectedLiveDisplay(secondaryDisplay.id));
        dispatch(setSettingsSelectedLiveDisplay(secondaryDisplay.id));

        // Auto-create the live display window
        setTimeout(async () => {
          const success = await createLive(secondaryDisplay.id);
          if (success) {
            console.log("Auto live display created successfully");
            // Content will be automatically set by the LiveDisplay component
          } else {
            console.log("Failed to auto-create live display");
          }
        }, 1000);
      } else if (selectedLiveDisplayId && !liveDisplayStatus?.hasWindow) {
        // If a display is selected but no live window exists, create it
        console.log(
          "Auto-creating live display for selected display:",
          selectedLiveDisplayId
        );

        setTimeout(async () => {
          const success = await createLive(selectedLiveDisplayId);
          if (success) {
            console.log("Auto live display recreated successfully");
            // Content will be automatically set by the LiveDisplay component
          }
        }, 1000);
      } else if (selectedLiveDisplayId && liveDisplayStatus?.hasWindow) {
        // If display already exists, just ensure default content is set
        console.log("Live display already exists, ensuring default content is set");
        setDefaultContent();
      }
    }, 500);
  }, [
    dispatch,
    hasMultipleDisplays,
    secondaryDisplay,
    selectedLiveDisplayId,
    createLive,
    liveDisplayStatus,
    setDefaultContent,
  ]);

  return {
    initializeLiveDisplay,
    displays,
    hasMultipleDisplays,
    secondaryDisplay,
    selectedLiveDisplayId,
    liveDisplayStatus,
    setDefaultContent,
  };
};
