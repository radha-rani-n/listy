import { View } from "react-native";
import { useResponsive } from "@/lib/useResponsive";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function ResponsiveContainer({ children, className = "" }: Props) {
  const { contentWidth, screenSize } = useResponsive();

  return (
    <View style={{ flex: 1 }} className={className}>
      {children}
    </View>
  );
}
