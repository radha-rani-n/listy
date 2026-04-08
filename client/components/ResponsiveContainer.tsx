import { View } from "react-native";
import { useResponsive } from "@/lib/useResponsive";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function ResponsiveContainer({ children, className = "" }: Props) {
  const { contentWidth, screenSize } = useResponsive();

  return (
    <View
      style={{
        flex: 1,
        alignItems: screenSize !== "mobile" ? "center" : undefined,
      }}
    >
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: typeof contentWidth === "number" ? contentWidth : undefined,
        }}
        className={className}
      >
        {children}
      </View>
    </View>
  );
}
