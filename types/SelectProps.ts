export interface SelectProps {
    label: string;
    selectedValue: string;
    onValueChange: (value: string) => void;
    options: { label: string; value: string }[];
    style?: object;
    itemStyle?: object;
}