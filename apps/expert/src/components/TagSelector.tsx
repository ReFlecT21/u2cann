import React, { createContext, useContext, useState, useEffect } from "react";

//
// CONTEXT & HOOK
//
interface TagSelectorContextProps {
  values: string[];
  addValue: (val: string) => void;
  removeLastValue: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const TagSelectorContext = createContext<TagSelectorContextProps | null>(null);

const useTagSelectorContext = () => {
  const context = useContext(TagSelectorContext);
  if (!context) {
    throw new Error(
      "TagSelector compound components must be used within a TagSelector provider",
    );
  }
  return context;
};

//
// MAIN COMPONENT (TagSelector)
//
interface TagSelectorProps {
  values: string[];
  onValuesChange: (values: string[]) => void;
  children: React.ReactNode;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  values: initialValues,
  onValuesChange,
  children,
}) => {
  const [values, setValues] = useState<string[]>(initialValues || []);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Listen for updates from props to reset the internal state.
  useEffect(() => {
    setValues(initialValues || []);
    setSearchQuery("");
  }, [initialValues]);

  const addValue = (val: string) => {
    const trimmed = val.trim();
    if (trimmed.length === 0) return;
    const newValues = [...values, trimmed];
    setValues(newValues);
    onValuesChange(newValues);
    setSearchQuery("");
  };

  const removeLastValue = () => {
    if (values.length === 0) return;
    const newValues = values.slice(0, -1);
    setValues(newValues);
    onValuesChange(newValues);
  };

  return (
    <TagSelectorContext.Provider
      value={{
        values,
        addValue,
        removeLastValue,
        searchQuery,
        setSearchQuery,
      }}
    >
      <div>{children}</div>
    </TagSelectorContext.Provider>
  );
};

//
// TRIGGER COMPONENT (TagSelectorTrigger)
//
interface TagSelectorTriggerProps {
  children: React.ReactNode;
}

export const TagSelectorTrigger: React.FC<TagSelectorTriggerProps> = ({
  children,
}) => {
  const { values } = useTagSelectorContext();

  return (
    <div
      className="flex flex-wrap gap-2 items-center p-2 rounded border cursor-text"
      onClick={() => {
        // Optionally, you can focus the input field here.
      }}
    >
      {values.map((val, index) => (
        <div
          key={index}
          className="py-1 px-2 text-sm text-gray-700 bg-gray-200 rounded-full"
        >
          {val}
        </div>
      ))}
      {children}
    </div>
  );
};

//
// INPUT COMPONENT (TagSelectorInput)
//
interface TagSelectorInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const TagSelectorInput: React.FC<TagSelectorInputProps> = (props) => {
  const { searchQuery, setSearchQuery, addValue, removeLastValue } =
    useTagSelectorContext();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // When space is pressed, add the current search query as a tag.
      if (searchQuery.trim() !== "") {
        e.preventDefault(); // Prevents inserting an actual space.
        addValue(searchQuery);
      }
    } else if (e.key === "Backspace") {
      // If the free text is empty, remove the last tag.
      if (searchQuery === "") {
        e.preventDefault();
        removeLastValue();
      }
    }
    props.onKeyDown && props.onKeyDown(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    props.onChange && props.onChange(e);
  };

  return (
    <input
      {...props}
      value={searchQuery}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className="flex-1 outline-none"
    />
  );
};

//
// CONTENT COMPONENT (TagSelectorContent)
//
interface TagSelectorContentProps {
  children: React.ReactNode;
}

export const TagSelectorContent: React.FC<TagSelectorContentProps> = ({
  children,
}) => {
  return <div className="p-2 mt-2 rounded border">{children}</div>;
};

//
// LIST COMPONENT (TagSelectorList)
//
interface TagSelectorListProps {
  children: React.ReactNode;
}

export const TagSelectorList: React.FC<TagSelectorListProps> = ({
  children,
}) => {
  return <ul className="p-0 m-0 list-none">{children}</ul>;
};

//
// ITEM COMPONENT (TagSelectorItem)
//
interface TagSelectorItemProps {
  value: string;
  children: React.ReactNode;
}

export const TagSelectorItem: React.FC<TagSelectorItemProps> = ({
  value,
  children,
}) => {
  const { addValue } = useTagSelectorContext();

  const handleClick = () => {
    addValue(value);
  };

  return (
    <li
      onClick={handleClick}
      className="py-1 px-2 cursor-pointer hover:bg-gray-100"
    >
      {children}
    </li>
  );
};
