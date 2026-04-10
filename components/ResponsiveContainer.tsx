import { View, useWindowDimensions } from "react-native";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function ResponsiveContainer({ children, className = "" }: Props) {
  const { width } = useWindowDimensions();

  // Adaptive horizontal padding based on screen width
  const horizontalPadding =
    width >= 1280 ? (width - 1100) / 2 :  // huge desktop — center 1100px
    width >= 1024 ? (width - 900) / 2 :    // desktop — center 900px
    width >= 768 ? 32 :                    // tablet
    0;                                     // mobile (let inner padding handle it)

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: horizontalPadding,
      }}
      className={className}
    >
      {children}
    </View>
  );
}
