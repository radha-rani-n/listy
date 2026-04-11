import { View } from "react-native";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function ResponsiveContainer({ children, className = "" }: Props) {
  return (
    <View style={{ flex: 1 }} className={className}>
      {children}
    </View>
  );
}
