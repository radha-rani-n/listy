import { useWindowDimensions } from "react-native";

export type ScreenSize = "mobile" | "tablet" | "desktop";

export function useResponsive() {
  const { width } = useWindowDimensions();

  const screenSize: ScreenSize =
    width >= 1024 ? "desktop" :
    width >= 768 ? "tablet" :
    "mobile";

  return {
    width,
    screenSize,
    isMobile: screenSize === "mobile",
    isTablet: screenSize === "tablet",
    isDesktop: screenSize === "desktop",
    // Content max width
    contentWidth: screenSize === "desktop" ? 960 : screenSize === "tablet" ? "100%" : "100%",
    // Side padding
    contentPadding: screenSize === "desktop" ? 32 : screenSize === "tablet" ? 24 : 16,
    // Grid columns for recipe cards etc.
    gridColumns: screenSize === "desktop" ? 3 : screenSize === "tablet" ? 2 : 1,
  };
}
