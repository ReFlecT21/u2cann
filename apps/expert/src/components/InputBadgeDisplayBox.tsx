import { Badge } from "@adh/ui/ui/badge";
import { Input } from "@adh/ui/ui/input";

export default function InputBadgeDisplayBox({ data }: { data: string[] }) {
  return (
    <div className="relative">
      <Input disabled />
      <div className="absolute inset-y-0 left-2 flex items-center">
        {data.map((data, index) => (
          <Badge key={index} className="mr-2 bg-gray-500 hover:bg-gray-500">
            {data}
          </Badge>
        ))}
      </div>
    </div>
  );
}
