import { useEffect, useState } from "react";
import Artplayer from "artplayer";
import { type Option } from "artplayer/types/option";
import { type Component } from "artplayer/types/component";
import artplayerPluginHlsQuality from "artplayer-plugin-hls-quality";
import Hls from "hls.js";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

// Define the level type
interface HLSLevel {
  height: number;
  width: number;
  bitrate: number;
  url: string;
  index?: number;
}

interface QualityLevel {
  height: number;
  html: string;
}

// Define types for sandbox detection results
interface SandboxDetails {
  sandboxed: boolean;
  reasons?: string[];
  environments?: string[];
  securityLevel?: number;
}

// Add type declaration for sandbox detection
declare global {
  interface Document {
    sandbox?: DOMTokenList;
  }
  interface Window {
    controlsTimeout?: NodeJS.Timeout;
    sandblaster?: {
      detect: () => SandboxDetails;
    };
  }
}

// Extend Window interface to support custom property
declare global {
  interface Window {
    controlsTimeout?: NodeJS.Timeout;
  }
}

export default function Player({
  option,
  getInstance,
  artRef,
  sub,
  posterUrl, // Add this prop
  availableLang = [], // Add this prop with default empty array
  onLanguageChange, // Add this prop
  ...rest
}: {
  option: Option;
  getInstance?: (art: Artplayer) => void;
  artRef: any;
  sub?: any;
  posterUrl?: string; // Add this prop
  availableLang?: string[]; // Add this to the type
  onLanguageChange?: (lang: string) => void; // Add this to the type
  [key: string]: any;
}) {
  //const posterUrl = useSelector(
  //(state: RootState) => state.posterUrl.currentPosterUrl
  //);
  const [isSandboxed, setIsSandboxed] = useState<boolean>(false);
  const [showControls, setShowControls] = useState(false);
  const [sandboxDetails, setSandboxDetails] = useState<SandboxDetails | null>(
    null
  );

  useEffect(() => {
    // Load Sandblaster script
    const script = document.createElement("script");
    script.src = "https://unpkg.com/sandblaster/dist/sandblaster.min.js";
    script.async = true;
    document.body.appendChild(script);

    // Sandbox detection function
    const checkSandbox = () => {
      try {
        // Check if Sandblaster is available
        if (window.sandblaster && window.sandblaster.detect) {
          // Use Sandblaster to detect sandbox status
          const result = window.sandblaster.detect();

          // Set sandboxed state
          setIsSandboxed(result.sandboxed === true);

          // Store full sandbox details
          setSandboxDetails(result);

          // Log detailed sandbox information
          console.log("Sandbox Detection Result:", result);
        } else {
          // Fallback detection methods
          // Method 1: Check document.sandbox attribute
          if (document.sandbox && document.sandbox.length > 0) {
            setIsSandboxed(true);
          }

          // Method 2: Check for CSP restrictions
          try {
            const testElement = document.createElement("div");
            testElement.innerHTML = '<img src="data:text/html">';
          } catch (e) {
            setIsSandboxed(true);
          }
        }
      } catch (error) {
        console.error("Sandbox detection error:", error);
        setIsSandboxed(false);
      }
    };

    // Wait for script to load
    script.onload = checkSandbox;

    console.log(posterUrl);
    const storedImageUrl = localStorage.getItem("currentPosterUrl");
    const container = artRef.current;

    if (!(container instanceof Element)) {
      console.error("Invalid container element for ArtPlayer");
      return;
    }

    const style = document.createElement("style");
    style.textContent = `
      
        
        .art-video-player .art-progress .art-progress-bar {
          height: 4px !important; /* Make the line bolder */
          
        }
        
        .art-video-player .art-progress .art-progress-loaded {
          height: 4px !important; /* Match the bar height */
          
        }
        
        .art-video-player .art-progress .art-progress-played {
          height: 4px !important; /* Match the bar height */
          
        }
        
        .art-video-player .art-progress .art-progress-highlight {
          height: 4px !important; /* Match the bar height */
        }
        
        .art-video-player .art-progress .art-progress-indicator {
          transform: scale(0.6) !important; /* Reduce dot size by 40% */
          width: 16px !important;
      height: 16px !important;
      top: -6px !important;
      background-color: transparent !important;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cpath fill='white' stroke='white' stroke-width='1' d='M 33.488281 1.9863281 A 1.50015 1.50015 0 0 0 32.5625 2.328125 L 23.533203 9.5527344 L 17.476562 4.3613281 A 1.50015 1.50015 0 1 0 15.523438 6.6386719 L 19.445312 10 L 11.5 10 C 7.9280619 10 5 12.928062 5 16.5 L 5 34.5 C 5 38.071938 7.9280619 41 11.5 41 L 36.5 41 C 40.071938 41 43 38.071938 43 34.5 L 43 16.5 C 43 12.928062 40.071938 10 36.5 10 L 27.777344 10 L 34.4375 4.671875 A 1.50015 1.50015 0 0 0 33.488281 1.9863281 z M 11.5 13 L 23.486328 13 L 36.5 13 C 38.450062 13 40 14.549938 40 16.5 L 40 34.5 C 40 36.450062 38.450062 38 36.5 38 L 11.5 38 C 9.5499381 38 8 36.450062 8 34.5 L 8 16.5 C 8 14.549938 9.5499381 13 11.5 13 z M 35.5 20 A 1.5 1.5 0 0 0 35.5 23 A 1.5 1.5 0 0 0 35.5 20 z M 35.5 27 A 1.5 1.5 0 0 0 35.5 30 A 1.5 1.5 0 0 0 35.5 27 z'/%3E%3C/svg%3E") !important;
      background-size: contain !important;
      background-repeat: no-repeat !important;
      background-position: center !important;
      filter: brightness(0) invert(1) !important; /* This ensures solid white */
        }
        
        .art-video-player .art-progress:hover .art-progress-indicator {
          transform: scale(0.8) !important; /* Slightly larger on hover */
        }
        
        .art-video-player .art-progress {
          margin-top: 2px !important; /* Adjust for thicker line */
        }
        .art-video-player {
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
        }

        .art-video-player .art-controls {
          bottom: 0 !important;
          margin-bottom: 0 !important;
        }

        .art-video-player .art-control-progress {
          bottom: 0 !important;
        }

        .art-video-player .art-control-fullscreen {
          margin-bottom: 0 !important;
        }
        /* Add custom scrollbar styles */
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.5) rgba(0, 0, 0, 0.3);
  }
  
  /* For webkit browsers */
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 4px;
  }
        
    
      `;
    document.head.appendChild(style);

    const art = new Artplayer({
      ...option,
      settings: [
        {
          html: "Quality",
          tooltip: "Quality",
          name: "quality",
          selector: [
            {
              html: "480P",
              default: true,
              value: "480p",
            },
            {
              html: "720P",
              value: "720p",
            },
            {
              html: "1080P",

              value: "1080p",
            },
          ],
          onSelect: function (item) {
            // Get quality levels from HLS
            const levels = art.hls.levels;
            if (!levels || levels.length === 0) return item.html;

            // Find the closest matching quality level
            const selectedLevel = levels.reduce(
              (prev: HLSLevel, curr: HLSLevel, index: number) => {
                const prevDiff = Math.abs(prev.height - item.value);
                const currDiff = Math.abs(curr.height - item.value);
                return currDiff < prevDiff ? { ...curr, index } : prev;
              },
              { ...levels[0], index: 0 }
            );

            art.hls.currentLevel = selectedLevel.index;
            return item.html;
          },
        },
      ],
      container: artRef.current!,
      layers: [
        {
          name: "poster",
          html: posterUrl
            ? `<img style="object-fit: cover; height: 100%; width: 100%;" src="${posterUrl}">`
            : "",
          tooltip: "Poster Tip",
          style: {
            position: "absolute",
            top: "0",
            right: "0",
            height: "100%",
            width: "100%",
            overflow: "hidden",
          },
          click: function (...args) {
            console.info("click", args);
          },
          mounted: function (...args) {
            console.info("mounted", args);
          },
        },

        {
          name: "languageSelector",
          html: `
              <div class="language-selector" style="
                position: absolute;
                top: 20px;
                right: 20px;
                background-color: #fcba03;
                padding: 8px;
                border-radius: 4px;
                cursor: pointer;
                z-index: 100;
                transition: all 0.3s ease;
              ">
                <div class="current-lang" style="
                  color: black;
                  background-color: #fcba03;
                  font-size: 14px;
                  font-weight: 600;
                  display: flex;
                  align-items: center;
                  gap: 4px;
                ">
                  <span>${availableLang[0] || "Select Language"}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
                <div class="lang-options" style="
                  display: none;
                  position: absolute;
                  top: 100%;
                  right: 0;
                  background-color: rgba(0, 0, 0, 0.9);
                  border-radius: 4px;
                  margin-top: 4px;
                  min-width: 100px;
                  max-height: 100px;
                  overflow-y: auto;
                  border: 1px solid white;
                ">
                  ${availableLang
                    .map(
                      (lang: string) => `
                    <div class="lang-option" data-value="${lang}" style="
                    color: ${lang === availableLang[0] ? "#fcba03" : "white"};
                    background-color: ${
                      lang === availableLang[0] ? "#49484a" : "transparent"
                    };
                      padding: 8px 12px;
                      cursor: pointer;
                      font-size: 14px;
                      transition: background-color 0.2s;
                    ">
                      ${lang}
                    </div>
                  `
                    )
                    .join("")}
                </div>
              </div>
            `,
          click: function (_, event) {
            const target = event.target as HTMLElement;
            const selector = target.closest(".language-selector");
            const option = target.closest(".lang-option");

            if (selector) {
              const options = selector.querySelector(
                ".lang-options"
              ) as HTMLElement;
              if (options) {
                const isHidden = options.style.display === "none";
                options.style.display = isHidden ? "block" : "none";

                if (isHidden) {
                  // When opening the dropdown, highlight the current selection
                  const currentLangText =
                    selector.querySelector(".current-lang span")?.textContent;
                  const allOptions = options.querySelectorAll(".lang-option");
                  allOptions.forEach((opt) => {
                    const optElement = opt as HTMLElement;
                    const isCurrentLang =
                      optElement.getAttribute("data-value") === currentLangText;
                    optElement.style.backgroundColor = isCurrentLang
                      ? "#49484a"
                      : "transparent";
                    optElement.style.color = isCurrentLang
                      ? "#fcba03"
                      : "white";
                  });
                }
              }
            }

            if (option && onLanguageChange) {
              const value = option.getAttribute("data-value");
              if (value) {
                //setCurrentLang(value);
                onLanguageChange(value);

                // Update all options to remove selected styling
                const allOptions = selector?.querySelectorAll(".lang-option");
                allOptions?.forEach((opt) => {
                  const optElement = opt as HTMLElement;
                  optElement.style.backgroundColor = "transparent";
                  optElement.style.color = "white";
                });

                // Add selected styling to clicked option
                const optionElement = option as HTMLElement;
                optionElement.style.backgroundColor = "#49484a";
                optionElement.style.color = "#fcba03";
                const currentLang = selector?.querySelector(
                  ".current-lang span"
                ) as HTMLElement;
                if (currentLang) {
                  currentLang.textContent = value;
                }
                const options = selector?.querySelector(
                  ".lang-options"
                ) as HTMLElement;
                if (options) {
                  options.style.display = "none";
                }
              }
            }
          },
          mounted: function (layer) {
            // Add hover effects
            const selector = layer.querySelector(
              ".language-selector"
            ) as HTMLElement;
            if (selector) {
              selector.addEventListener("mouseenter", () => {
                selector.style.backgroundColor = "#fcba03";
              });
              selector.addEventListener("mouseleave", () => {
                selector.style.backgroundColor = "#fcba03";
                const options = selector.querySelector(
                  ".lang-options"
                ) as HTMLElement;
                if (options) {
                  options.style.display = "none";
                }
              });

              // Add hover effect for options
              const options = selector.querySelectorAll(".lang-option");
              options.forEach((option) => {
                const optionElement = option as HTMLElement;
                optionElement.addEventListener("mouseenter", () => {
                  if (optionElement.style.color !== "#fcba03") {
                    optionElement.style.backgroundColor =
                      "rgba(255, 255, 255, 0.1)";
                  }
                });
                optionElement.addEventListener("mouseleave", () => {
                  const currentLangText =
                    selector.querySelector(".current-lang span")?.textContent;
                  const isCurrentLang =
                    optionElement.getAttribute("data-value") ===
                    currentLangText;
                  if (!isCurrentLang) {
                    optionElement.style.backgroundColor = "transparent";
                  }
                });
              });
              // Add custom scrollbar styles
              const langOptions = selector.querySelector(
                ".lang-options"
              ) as HTMLElement;
              if (langOptions) {
                langOptions.classList.add("custom-scrollbar");
              }
            }
          },
        },
        // Add sandbox warning layer
        ...(isSandboxed
          ? [
              {
                name: "sandbox-warning",
                html: `
            <div style="
              position: absolute;
              top: 10px;
              left: 10px;
              background-color: rgba(255, 0, 0, 0.7);
              color: white;
              padding: 5px 10px;
              border-radius: 4px;
              z-index: 100;
            ">
              Sandboxed Environment Detected
            </div>
          `,
                style: {
                  zIndex: "100",
                },
              },
            ]
          : []),
      ],
      plugins: [],
      controls: [
        {
          name: 'play',
          position: 'left',
        },
        {
          name: 'volume',
          position: 'left',
        },
        {
          name: 'time',
          position: 'left',
        },
        {
          name: 'setting',
          position: 'right',
        },
        {
          name: 'fullscreen',
          position: 'right',
        },
      ],
      customType: {
        m3u8: function playM3u8(video, url, art) {
          if (Hls.isSupported()) {
            if (art.hls) art.hls.destroy();
            const hls = new Hls({
              debug: true, // Enable debug logs
            });

            // Add error handling
            hls.on(Hls.Events.ERROR, function (event, data) {
              if (data.fatal) {
                console.error("HLS error:", data);
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    console.log("Network error - attempting to recover...");
                    hls.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    console.log("Media error - attempting to recover...");
                    hls.recoverMediaError();
                    break;
                  default:
                    // Cannot recover
                    hls.destroy();
                    art.notice.show = `Playback error: ${data.type}`;
                    break;
                }
              }
            });

            // Add loading state handler
            hls.on(Hls.Events.MANIFEST_LOADING, () => {
              console.log("Loading manifest from URL:", url);
            });

            hls.on(Hls.Events.MANIFEST_LOADED, () => {
              console.log("Manifest loaded successfully");
            });

            try {
              hls.loadSource(url);
              hls.attachMedia(video);
              art.hls = hls;

              // Add event listener for level loading
              hls.on(Hls.Events.MANIFEST_PARSED, function (_, data) {
                console.log("Available levels:", hls.levels);

                if (hls.levels.length > 0) {
                  const standardQualities: QualityLevel[] = [
                    { height: 1080, html: "1080P" },
                    { height: 720, html: "720P" },
                    { height: 480, html: "480P" },
                    { height: 360, html: "360P" },
                    { height: 240, html: "240P" },
                  ];
                  // Filter available qualities to closest matching standard qualities
                  const availableQualities = standardQualities
                    .filter((sq) => {
                      // Only include qualities that have a reasonably close match
                      return hls.levels.some(
                        (level) => Math.abs(level.height - sq.height) < 100
                      );
                    })
                    .map((sq) => ({
                      html: sq.html,
                      value: sq.height,
                      default: sq.height === 1080, // Set 1080P as default if available
                    }));

                  // If 1080P is not available, set the highest available quality as default
                  if (!availableQualities.some((q) => q.default)) {
                    availableQualities[0].default = true;
                  }

                  // Update the quality selector options
                  art.setting.update({
                    name: "quality",
                    selector: availableQualities,
                  });
                }
              });

              art.on("destroy", () => {
                console.log("Destroying HLS instance");
                hls.destroy();
              });
            } catch (error) {
              console.error("Error setting up HLS:", error);
              art.notice.show = "Failed to load video source";
            }
          } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            // Fallback for Safari
            video.src = url;
          } else {
            art.notice.show = "Unsupported playback format: m3u8";
          }
        },
      },
    });

    art.on("ready", () => {
      art.play();
      art.forward = 10;
      art.backward = 10;
    });
    if (getInstance && typeof getInstance === "function") {
      getInstance(art);
    }
    art.events.proxy(document, "keypress", (event: any) => {
      // Check if the focus is on an input field or textarea
      const isInputFocused =
        document?.activeElement?.tagName === "INPUT" ||
        document?.activeElement?.tagName === "TEXTAREA";

      if (!isInputFocused && event?.code === "Space") {
        event.preventDefault();
        art.playing ? art.pause() : art.play();
      } else if (!isInputFocused && event?.code === "KeyF") {
        event.preventDefault();
        art.fullscreen = !art.fullscreen;
      } else if (!isInputFocused && event?.code === "ArrowLeft") {
        event.preventDefault();
        art.currentTime = Math.max(0, art.currentTime - 10);
      } else if (!isInputFocused && event?.code === "ArrowRight") {
        event.preventDefault();
        art.currentTime = Math.min(art.duration, art.currentTime + 10);
      }
    });

    art.on("play", () => {
      art.layers.update({
        name: "poster",
        html: posterUrl
          ? `<img style="object-fit: cover; height: 100%; width: 100%;" src="${posterUrl}">`
          : "",
        tooltip: "Poster Tip",
        style: {
          position: "absolute",
          display: "none",
          top: "0",
          right: "0",
          height: "100%",
          width: "100%",
          overflow: "hidden",
        },
      });
    });
    art.on("pause", () => {
      art.layers.update({
        name: "poster",
        html: posterUrl
          ? `<img style="object-fit: cover; height: 100%; width: 100%;" src="${posterUrl}">`
          : "",
        tooltip: "Poster Tip",
        style: {
          position: "absolute",
          display: "block",
          top: "0",
          right: "0",
          height: "100%",
          width: "100%",
          overflow: "hidden",
        },
      });
    });

    //art.controls.remove("playAndPause");

    if (sub?.length > 0) {
      art.controls.add({
        name: "subtitle",
        position: "right",
        html: `subtitle`,
        selector: [
          {
            default: true,
            html: `off`,
            value: "",
          },
          ...sub.map((item: any, i: number) => {
            return {
              html: `<div>${item.lang}</div>`,
              value: item?.url,
            };
          }),
        ],
        onSelect: function (item, $dom) {
          // @ts-ignore
          art.subtitle.switch(item.value);
          return item.html;
        },
      });
    }
    art.controls.update({
      name: "volume",
      position: "right",
    });
    console.log("controls", art.controls);
    // If sandbox is detected, add a notice
    if (isSandboxed) {
      art.notice.show = "Running in a restricted environment";
    }
    return () => {
      if (art && art.destroy) {
        art.destroy(false);
        art?.hls?.destroy();
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [artRef.current, posterUrl]);

  //

  return (
    <div
      ref={artRef}
      className="w-full h-full"
      data-sandboxed={isSandboxed}
      {...rest}
    ></div>
  );
}
