import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setLiveDisplayContent, 
  setLiveDisplayTheme, 
  clearLiveDisplayContent,
  selectLiveDisplayContent,
  selectLiveDisplayTheme,
  selectDisplays,
  selectDisplaySettings,
  selectSelectedLiveDisplay,
  setSelectedLiveDisplay,
  setLiveDisplayActive
} from '@/lib/displaySlice';
import { 
  Content,
  TextContent,
  MediaContent,
  RichTextContent,
  SystemContent,
  SlideContent,
  createTextContent,
  createMediaContent,
  createSystemContent,
  createPlaceholderContent,
  createBlackScreenContent,
  createLogoScreenContent,
  TextStyling,
  TextEffects,
  MediaData,
  RichTextData,
  SystemData,
  SlideData,
  AnimationConfig,
  TransitionConfig,
  SlideStyle,
  BackgroundStyle,
  LayoutStyle,
  EffectStyle,
  ResponsiveStyle
} from '@/types/content';
import { SlideTheme } from '@/services/RenderingEngine';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RenderingTestPageProps {}

export const RenderingTestPage: React.FC<RenderingTestPageProps> = () => {
  const dispatch = useDispatch();
  const currentContent = useSelector(selectLiveDisplayContent);
  const currentTheme = useSelector(selectLiveDisplayTheme);
  const displays = useSelector(selectDisplays);
  const displaySettings = useSelector(selectDisplaySettings);
  const selectedLiveDisplay = useSelector(selectSelectedLiveDisplay);
  
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [testResults, setTestResults] = useState<Record<string, 'pending' | 'success' | 'error'>>({});
  const [liveDisplayStatus, setLiveDisplayStatus] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [customSettings, setCustomSettings] = useState({
    fontSize: '48px',
    fontFamily: 'Arial',
    textColor: '#ffffff',
    backgroundColor: '#000000',
    mediaUrl: '',
    mediaType: 'image' as 'image' | 'video' | 'audio',
    animationType: 'fade' as 'fade' | 'slide' | 'zoom' | 'rotate' | 'bounce' | 'flip',
    transitionType: 'fade' as 'fade' | 'slide' | 'push' | 'cover' | 'uncover' | 'none',
    backgroundType: 'color' as 'color' | 'gradient' | 'image' | 'video',
    backgroundValue: '#000000'
  });

  // Initialize live display status
  useEffect(() => {
    const checkLiveDisplayStatus = async () => {
      try {
        const status = await window.electron?.liveDisplay?.getStatus();
        setLiveDisplayStatus(status);
      } catch (error) {
        console.error('Error checking live display status:', error);
      }
    };

    checkLiveDisplayStatus();
    const interval = setInterval(checkLiveDisplayStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  // Initialize live display if not active
  const initializeLiveDisplay = async () => {
    try {
      setIsInitializing(true);
      
      // Get secondary display or fallback to primary
      const secondaryDisplay = displays.find(d => !d.isPrimary);
      const targetDisplayId = secondaryDisplay?.id || displays[0]?.id;
      
      if (!targetDisplayId) {
        throw new Error('No display available for live display');
      }

      // Initialize live display via IPC
      const result = await window.electron?.displayManager?.initializeLiveDisplay(targetDisplayId);
      
             if (result?.success) {
         dispatch(setSelectedLiveDisplay(targetDisplayId));
         dispatch(setLiveDisplayActive(true));
        
        // Update status
        const status = await window.electron?.liveDisplay?.getStatus();
        setLiveDisplayStatus(status);
        
        console.log('Live display initialized successfully');
      } else {
        throw new Error(result?.error || 'Failed to initialize live display');
      }
    } catch (error) {
      console.error('Error initializing live display:', error);
      setTestResults(prev => ({ ...prev, 'init-error': 'error' }));
    } finally {
      setIsInitializing(false);
    }
  };

  // Send content to live display
  const sendContentToLiveDisplay = async (content: Content) => {
    try {
             if (!displaySettings.isLiveDisplayActive || !liveDisplayStatus?.hasWindow) {
        await initializeLiveDisplay();
      }
      
      // Send content via IPC to live display window
      await window.electron?.liveDisplay?.sendContent(content);
      
      // Also update Redux state for consistency
      dispatch(setLiveDisplayContent(content));
      
      return true;
    } catch (error) {
      console.error('Error sending content to live display:', error);
      return false;
    }
  };

  // Test scenarios for different content types
  const testScenarios = {
    // Text Content Tests
    'text-basic': {
      name: 'Basic Text',
      description: 'Simple text with default styling',
      category: 'text',
      test: async () => {
        const content = createTextContent('test-text-basic', 'Hello World!', {
          fontSize: '48px',
          fontFamily: 'Arial',
          fontWeight: 'normal',
          textAlign: 'center',
          textColor: '#ffffff',
          backgroundColor: '#000000',
          lineHeight: 1.2,
          padding: { top: 20, right: 20, bottom: 20, left: 20 }
        });
        
        const success = await sendContentToLiveDisplay(content);
        setTestResults(prev => ({ ...prev, 'text-basic': success ? 'success' : 'error' }));
      }
    },
    'text-effects': {
      name: 'Text with Effects',
      description: 'Text with shadow, outline, and glow effects',
      category: 'text',
      test: async () => {
        const content: TextContent = {
          id: 'test-text-effects',
          type: 'text',
          data: {
            text: 'Styled Text with Effects',
            styling: {
              fontSize: '56px',
              fontFamily: 'Georgia',
              fontWeight: 'bold',
              textAlign: 'center',
              textColor: '#ffffff',
              backgroundColor: '#1a1a1a',
              lineHeight: 1.3,
              padding: { top: 30, right: 30, bottom: 30, left: 30 }
            },
            effects: {
              shadow: {
                x: 2,
                y: 2,
                blur: 4,
                color: '#000000'
              },
              outline: {
                width: 2,
                color: '#ff6b6b'
              },
              glow: {
                color: '#4ecdc4',
                intensity: 10,
                spread: 20
              }
            }
          }
        };
        
        const success = await sendContentToLiveDisplay(content);
        setTestResults(prev => ({ ...prev, 'text-effects': success ? 'success' : 'error' }));
      }
    },
    'text-custom': {
      name: 'Custom Text',
      description: 'Text with user-defined settings',
      category: 'text',
      test: async () => {
        const content = createTextContent('test-text-custom', 'Custom Text Settings', {
          fontSize: customSettings.fontSize,
          fontFamily: customSettings.fontFamily,
          fontWeight: 'normal',
          textAlign: 'center',
          textColor: customSettings.textColor,
          backgroundColor: customSettings.backgroundColor,
          lineHeight: 1.2,
          padding: { top: 20, right: 20, bottom: 20, left: 20 }
        });
        
        const success = await sendContentToLiveDisplay(content);
        setTestResults(prev => ({ ...prev, 'text-custom': success ? 'success' : 'error' }));
      }
    },
    'text-alignments': {
      name: 'Text Alignments',
      description: 'Test different text alignments',
      category: 'text',
      test: async () => {
        const content = createTextContent('test-text-alignments', 'Left Aligned Text\nCenter Aligned Text\nRight Aligned Text', {
          fontSize: '32px',
          fontFamily: 'Arial',
          fontWeight: 'normal',
          textAlign: 'left',
          textColor: '#ffffff',
          backgroundColor: '#1a1a1a',
          lineHeight: 1.5,
          padding: { top: 40, right: 40, bottom: 40, left: 40 }
        });
        
        const success = await sendContentToLiveDisplay(content);
        setTestResults(prev => ({ ...prev, 'text-alignments': success ? 'success' : 'error' }));
      }
    },
    'text-multiline': {
      name: 'Multi-line Text',
      description: 'Test text with multiple lines and formatting',
      category: 'text',
      test: async () => {
        const content = createTextContent('test-text-multiline', 'Line 1: This is the first line\nLine 2: This is the second line\nLine 3: This is the third line with more content', {
          fontSize: '28px',
          fontFamily: 'Georgia',
          fontWeight: 'normal',
          textAlign: 'center',
          textColor: '#f0f0f0',
          backgroundColor: '#2a2a2a',
          lineHeight: 1.8,
          padding: { top: 30, right: 30, bottom: 30, left: 30 }
        });
        
        const success = await sendContentToLiveDisplay(content);
        setTestResults(prev => ({ ...prev, 'text-multiline': success ? 'success' : 'error' }));
      }
    },

    // Media Content Tests
    'media-image': {
      name: 'Image Display',
      description: 'Display an image with fit mode',
      category: 'media',
      test: async () => {
        const content = createMediaContent('test-media-image', 'https://via.placeholder.com/800x600/4ecdc4/ffffff?text=Test+Image', 'image');
        
        const success = await sendContentToLiveDisplay(content);
        setTestResults(prev => ({ ...prev, 'media-image': success ? 'success' : 'error' }));
      }
    },
    'media-video': {
      name: 'Video Display',
      description: 'Display a video with autoplay',
      category: 'media',
      test: async () => {
        const content: MediaContent = {
          id: 'test-media-video',
          type: 'media',
          data: {
            url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            mediaType: 'video',
            displayMode: 'fit',
            positioning: {
              x: 0,
              y: 0,
              width: 100,
              height: 100,
              zIndex: 1
            },
            scaling: {
              scaleX: 1,
              scaleY: 1,
              rotation: 0,
              skewX: 0,
              skewY: 0
            },
            playbackSettings: {
              autoplay: true,
              loop: true,
              volume: 0.5,
              startTime: 0,
              endTime: 0,
              speed: 1
            }
          }
        };
        
        const success = await sendContentToLiveDisplay(content);
        setTestResults(prev => ({ ...prev, 'media-video': success ? 'success' : 'error' }));
      }
    },
    'media-custom': {
      name: 'Custom Media',
      description: 'Media with user-defined URL',
      category: 'media',
      test: async () => {
        if (!customSettings.mediaUrl) {
          setTestResults(prev => ({ ...prev, 'media-custom': 'error' }));
          return;
        }
        const content = createMediaContent('test-media-custom', customSettings.mediaUrl, customSettings.mediaType);
        
        const success = await sendContentToLiveDisplay(content);
        setTestResults(prev => ({ ...prev, 'media-custom': success ? 'success' : 'error' }));
      }
    },
    'media-scaling': {
      name: 'Media Scaling',
      description: 'Test different media display modes',
      category: 'media',
      test: async () => {
        const content: MediaContent = {
          id: 'test-media-scaling',
          type: 'media',
          data: {
            url: 'https://via.placeholder.com/400x300/ff6b6b/ffffff?text=Scaling+Test',
            mediaType: 'image',
            displayMode: 'fill',
            positioning: {
              x: 10,
              y: 10,
              width: 80,
              height: 80,
              zIndex: 1
            },
            scaling: {
              scaleX: 1.2,
              scaleY: 1.2,
              rotation: 15,
              skewX: 0,
              skewY: 0
            }
          }
        };
        
        const success = await sendContentToLiveDisplay(content);
        setTestResults(prev => ({ ...prev, 'media-scaling': success ? 'success' : 'error' }));
      }
    },

    // Rich Text Content Tests
    'richtext-basic': {
      name: 'Rich Text Basic',
      description: 'Rich text with multiple blocks',
      category: 'richtext',
      test: async () => {
        const content: RichTextContent = {
          id: 'test-richtext-basic',
          type: 'richtext',
          data: {
            blocks: [
              {
                id: 'block-1',
                type: 'heading',
                content: 'Rich Text Heading',
                order: 1
              },
              {
                id: 'block-2',
                type: 'paragraph',
                content: 'This is a paragraph with some text content that demonstrates rich text rendering capabilities.',
                order: 2
              },
              {
                id: 'block-3',
                type: 'list',
                content: '• First item\n• Second item\n• Third item',
                order: 3
              },
              {
                id: 'block-4',
                type: 'quote',
                content: 'This is a quote block that shows how quotations are rendered.',
                order: 4
              }
            ],
            styling: {
              baseFont: 'Arial',
              baseFontSize: 24,
              baseColor: '#ffffff',
              lineHeight: 1.5,
              blockSpacing: 16
            },
            formatting: {
              bold: false,
              italic: false,
              underline: false,
              strikethrough: false,
              highlight: 'transparent'
            }
          }
        };
        
        const success = await sendContentToLiveDisplay(content);
        setTestResults(prev => ({ ...prev, 'richtext-basic': success ? 'success' : 'error' }));
      }
    },
    'richtext-styled': {
      name: 'Rich Text Styled',
      description: 'Rich text with custom styling and formatting',
      category: 'richtext',
      test: async () => {
        const content: RichTextContent = {
          id: 'test-richtext-styled',
          type: 'richtext',
          data: {
            blocks: [
              {
                id: 'styled-block-1',
                type: 'heading',
                content: 'Styled Rich Text',
                styling: {
                  fontSize: 48,
                  fontWeight: 'bold',
                  color: '#4ecdc4',
                  backgroundColor: '#1a1a1a',
                  padding: { top: 20, right: 20, bottom: 20, left: 20 }
                },
                order: 1
              },
              {
                id: 'styled-block-2',
                type: 'paragraph',
                content: 'This paragraph has custom styling applied.',
                styling: {
                  fontSize: 24,
                  color: '#ffffff',
                  backgroundColor: '#2a2a2a',
                  padding: { top: 15, right: 15, bottom: 15, left: 15 },
                  border: {
                    width: 2,
                    style: 'solid',
                    color: '#4ecdc4',
                    radius: 8
                  }
                },
                order: 2
              },
              {
                id: 'styled-block-3',
                type: 'code',
                content: 'const test = "Code block with styling";',
                styling: {
                  fontSize: 18,
                  color: '#a8e6cf',
                  backgroundColor: '#0d1117',
                  padding: { top: 20, right: 20, bottom: 20, left: 20 }
                },
                order: 3
              }
            ],
            styling: {
              baseFont: 'Inter',
              baseFontSize: 20,
              baseColor: '#ffffff',
              lineHeight: 1.6,
              blockSpacing: 20
            },
            formatting: {
              bold: true,
              italic: false,
              underline: false,
              strikethrough: false,
              highlight: 'transparent'
            }
          }
        };
        
        const success = await sendContentToLiveDisplay(content);
        setTestResults(prev => ({ ...prev, 'richtext-styled': success ? 'success' : 'error' }));
      }
    },

    // System Content Tests
    'system-black': {
      name: 'Black Screen',
      description: 'System black screen',
      category: 'system',
      test: async () => {
        try {
          await window.electron?.liveDisplay?.showBlack();
          const content = createBlackScreenContent('test-system-black');
          dispatch(setLiveDisplayContent(content));
          setTestResults(prev => ({ ...prev, 'system-black': 'success' }));
        } catch (error) {
          setTestResults(prev => ({ ...prev, 'system-black': 'error' }));
        }
      }
    },
    'system-logo': {
      name: 'Logo Screen',
      description: 'System logo screen with branding',
      category: 'system',
      test: async () => {
        try {
          await window.electron?.liveDisplay?.showLogo();
          const content = createLogoScreenContent('test-system-logo', 'PraisePresent', 'Rendering Engine Test');
          dispatch(setLiveDisplayContent(content));
          setTestResults(prev => ({ ...prev, 'system-logo': 'success' }));
        } catch (error) {
          setTestResults(prev => ({ ...prev, 'system-logo': 'error' }));
        }
      }
    },
    'system-placeholder': {
      name: 'Placeholder Screen',
      description: 'System placeholder with custom message',
      category: 'system',
      test: async () => {
        const content = createPlaceholderContent('test-system-placeholder', 'Test Mode Active', 'Rendering Engine Testing');
        
        const success = await sendContentToLiveDisplay(content);
        setTestResults(prev => ({ ...prev, 'system-placeholder': success ? 'success' : 'error' }));
      }
    },
    'system-error': {
      name: 'Error Screen',
      description: 'System error display',
      category: 'system',
      test: async () => {
        const content = createSystemContent('test-system-error', 'error', {
          variant: 'error',
          message: 'Test Error Message',
          details: 'This is a test error to demonstrate error rendering'
        });
        
        const success = await sendContentToLiveDisplay(content);
        setTestResults(prev => ({ ...prev, 'system-error': success ? 'success' : 'error' }));
      }
    },

    // Theme Tests
    'theme-light': {
      name: 'Light Theme',
      description: 'Apply light theme',
      category: 'theme',
      test: async () => {
        const theme: SlideTheme = {
          id: 'light-theme',
          name: 'Light Theme',
          colorPalette: {
            primary: '#2563eb',
            secondary: '#64748b',
            accent: '#f59e0b',
            background: '#ffffff',
            text: '#1f2937'
          },
          typography: {
            fontFamily: 'Inter',
            fontSize: 16,
            fontWeight: 'normal',
            lineHeight: 1.5
          },
          backgrounds: {}
        };
        dispatch(setLiveDisplayTheme(theme));
        
        const content = createTextContent('test-theme-light', 'Light Theme Applied', {
          fontSize: '48px',
          fontFamily: 'Inter',
          fontWeight: 'normal',
          textAlign: 'center',
          textColor: '#1f2937',
          backgroundColor: '#ffffff',
          lineHeight: 1.2,
          padding: { top: 20, right: 20, bottom: 20, left: 20 }
        });
        
        const success = await sendContentToLiveDisplay(content);
        setTestResults(prev => ({ ...prev, 'theme-light': success ? 'success' : 'error' }));
      }
    },
    'theme-dark': {
      name: 'Dark Theme',
      description: 'Apply dark theme',
      category: 'theme',
      test: async () => {
        const theme: SlideTheme = {
          id: 'dark-theme',
          name: 'Dark Theme',
          colorPalette: {
            primary: '#3b82f6',
            secondary: '#6b7280',
            accent: '#fbbf24',
            background: '#111827',
            text: '#f9fafb'
          },
          typography: {
            fontFamily: 'Inter',
            fontSize: 16,
            fontWeight: 'normal',
            lineHeight: 1.5
          },
          backgrounds: {}
        };
        dispatch(setLiveDisplayTheme(theme));
        
        const content = createTextContent('test-theme-dark', 'Dark Theme Applied', {
          fontSize: '48px',
          fontFamily: 'Inter',
          fontWeight: 'normal',
          textAlign: 'center',
          textColor: '#f9fafb',
          backgroundColor: '#111827',
          lineHeight: 1.2,
          padding: { top: 20, right: 20, bottom: 20, left: 20 }
        });
        
        const success = await sendContentToLiveDisplay(content);
        setTestResults(prev => ({ ...prev, 'theme-dark': success ? 'success' : 'error' }));
      }
    },

    // Clear content test
    'clear-content': {
      name: 'Clear Display',
      description: 'Clear all content from display',
      category: 'control',
      test: async () => {
        try {
          await window.electron?.liveDisplay?.clearContent();
          dispatch(clearLiveDisplayContent());
          setTestResults(prev => ({ ...prev, 'clear-content': 'success' }));
        } catch (error) {
          setTestResults(prev => ({ ...prev, 'clear-content': 'error' }));
        }
      }
    },
    'reset-test': {
      name: 'Reset to Default',
      description: 'Reset display to initial test state',
      category: 'control',
      test: async () => {
        const initialContent = createPlaceholderContent(
          'test-page-reset',
          'Rendering Engine Test Suite',
          'Select a test from the left panel to begin testing'
        );
        
        const success = await sendContentToLiveDisplay(initialContent);
        setTestResults(prev => ({ ...prev, 'reset-test': success ? 'success' : 'error' }));
      }
    }
  };

  // Run all tests in a category
  const runCategoryTests = (category: string) => {
    const categoryTests = Object.entries(testScenarios).filter(([_, test]) => test.category === category);
    
    categoryTests.forEach(([key, test], index) => {
      setTimeout(async () => {
        setTestResults(prev => ({ ...prev, [key]: 'pending' }));
        try {
          await test.test();
        } catch (error) {
          console.error(`Test ${key} failed:`, error);
          setTestResults(prev => ({ ...prev, [key]: 'error' }));
        }
      }, index * 2000); // 2 second delay between tests
    });
  };

  // Run all tests
  const runAllTests = () => {
    const allTests = Object.entries(testScenarios);
    
    allTests.forEach(([key, test], index) => {
      setTimeout(async () => {
        setTestResults(prev => ({ ...prev, [key]: 'pending' }));
        try {
          await test.test();
        } catch (error) {
          console.error(`Test ${key} failed:`, error);
          setTestResults(prev => ({ ...prev, [key]: 'error' }));
        }
      }, index * 3000); // 3 second delay between tests
    });
  };

  const getStatusBadge = (status: 'pending' | 'success' | 'error' | undefined) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-600">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Not Run</Badge>;
    }
  };

  const categories = ['text', 'media', 'richtext', 'system', 'theme', 'control'];

  return (
    <div className="rendering-test-page h-screen flex bg-gray-50">
      {/* Left Panel - Test Controls */}
      <div className="w-1/2 p-4 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4">Rendering Engine Test Suite</h1>
        
        {/* Live Display Status */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Live Display Status</CardTitle>
          </CardHeader>
          <CardContent>
            {!liveDisplayStatus?.hasWindow ? (
              <Alert className="mb-4">
                <AlertDescription>
                  Live display is not initialized. Click "Initialize Live Display" to start testing.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <Badge variant={liveDisplayStatus.isVisible ? "default" : "secondary"}>
                    {liveDisplayStatus.isVisible ? "Active" : "Hidden"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Display:</span>
                  <Badge variant="outline">{liveDisplayStatus.currentDisplayId || "None"}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Fullscreen:</span>
                  <Badge variant="outline">{liveDisplayStatus.isFullscreen ? "Yes" : "No"}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!liveDisplayStatus?.hasWindow && (
              <Button 
                onClick={initializeLiveDisplay} 
                disabled={isInitializing}
                className="w-full"
              >
                {isInitializing ? "Initializing..." : "Initialize Live Display"}
              </Button>
            )}
            <Button 
              onClick={runAllTests} 
              disabled={!liveDisplayStatus?.hasWindow}
              className="w-full"
            >
              Run All Tests
            </Button>
            <Button 
              onClick={() => {
                // Run a quick demo of each type
                const demoTests = ['text-basic', 'media-image', 'richtext-basic', 'system-logo', 'theme-dark'];
                demoTests.forEach((testKey, index) => {
                  setTimeout(async () => {
                    setSelectedTest(testKey);
                    const test = testScenarios[testKey as keyof typeof testScenarios];
                    if (test) {
                      await test.test();
                    }
                  }, index * 3000);
                });
              }} 
              disabled={!liveDisplayStatus?.hasWindow}
              variant="outline" 
              className="w-full"
            >
              Run Demo
            </Button>
            <Button 
              onClick={async () => {
                await window.electron?.liveDisplay?.clearContent();
                dispatch(clearLiveDisplayContent());
              }} 
              disabled={!liveDisplayStatus?.hasWindow}
              variant="outline" 
              className="w-full"
            >
              Clear Display
            </Button>
          </CardContent>
        </Card>

        {/* Custom Settings */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Custom Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Font Size</label>
              <input
                type="text"
                value={customSettings.fontSize}
                onChange={(e) => setCustomSettings(prev => ({ ...prev, fontSize: e.target.value }))}
                className="w-full p-2 border rounded"
                placeholder="48px"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Font Family</label>
              <select
                value={customSettings.fontFamily}
                onChange={(e) => setCustomSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
                className="w-full p-2 border rounded"
              >
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Inter">Inter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Text Color</label>
              <input
                type="color"
                value={customSettings.textColor}
                onChange={(e) => setCustomSettings(prev => ({ ...prev, textColor: e.target.value }))}
                className="w-full p-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Background Color</label>
              <input
                type="color"
                value={customSettings.backgroundColor}
                onChange={(e) => setCustomSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                className="w-full p-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Media URL</label>
              <input
                type="text"
                value={customSettings.mediaUrl}
                onChange={(e) => setCustomSettings(prev => ({ ...prev, mediaUrl: e.target.value }))}
                className="w-full p-2 border rounded"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Media Type</label>
              <select
                value={customSettings.mediaType}
                onChange={(e) => setCustomSettings(prev => ({ ...prev, mediaType: e.target.value as 'image' | 'video' | 'audio' }))}
                className="w-full p-2 border rounded"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Test Categories */}
        {categories.map(category => (
          <Card key={category} className="mb-4">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span className="capitalize">{category} Tests</span>
                <Button
                  size="sm"
                  onClick={() => runCategoryTests(category)}
                  disabled={!liveDisplayStatus?.hasWindow}
                  variant="outline"
                >
                  Run All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(testScenarios)
                  .filter(([_, test]) => test.category === category)
                  .map(([key, test]) => (
                    <div key={key} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{test.name}</div>
                        <div className="text-sm text-gray-600">{test.description}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(testResults[key])}
                        <Button
                          size="sm"
                          onClick={async () => {
                            setSelectedTest(key);
                            setTestResults(prev => ({ ...prev, [key]: 'pending' }));
                            try {
                              await test.test();
                            } catch (error) {
                              console.error(`Test ${key} failed:`, error);
                              setTestResults(prev => ({ ...prev, [key]: 'error' }));
                            }
                          }}
                          disabled={!liveDisplayStatus?.hasWindow}
                          variant="outline"
                        >
                          Run
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Right Panel - Test Info and Status */}
      <div className="flex-1 p-4 bg-white border-l">
        <div className="h-full flex flex-col">
          <h2 className="text-xl font-bold mb-4">Test Information</h2>
          
          {/* Current Test Info */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Current Test</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTest ? (
                <div>
                  <div className="font-medium mb-2">{testScenarios[selectedTest as keyof typeof testScenarios]?.name}</div>
                  <div className="text-sm text-gray-600 mb-2">
                    {testScenarios[selectedTest as keyof typeof testScenarios]?.description}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {testScenarios[selectedTest as keyof typeof testScenarios]?.category}
                    </Badge>
                    {getStatusBadge(testResults[selectedTest])}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No test selected</div>
              )}
            </CardContent>
          </Card>

          {/* Current Content Info */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Current Content</CardTitle>
            </CardHeader>
            <CardContent>
              {currentContent ? (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline">Type: {currentContent.type}</Badge>
                    <Badge variant="outline">ID: {currentContent.id}</Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    Content is being displayed on the live display window
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No content loaded</div>
              )}
            </CardContent>
          </Card>

          {/* Test Results Summary */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Test Results Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(testResults).map(([key, status]) => (
                  <div key={key} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{testScenarios[key as keyof typeof testScenarios]?.name || key}</span>
                    {getStatusBadge(status)}
                  </div>
                ))}
                {Object.keys(testResults).length === 0 && (
                  <div className="text-gray-500 text-center py-4">
                    No tests run yet. Click "Run All Tests" or individual test buttons to begin.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RenderingTestPage; 