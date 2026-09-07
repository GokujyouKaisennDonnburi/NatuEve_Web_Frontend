type NoteListProps = {
  items: readonly string[];
};

// ガイドライン本文の箇条書きリスト
export function NoteList({ items }: Readonly<NoteListProps>) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((text) => (
        <li
          key={text}
          className="flex items-start gap-2.5 text-base leading-[1.8] text-[#333]"
        >
          <span
            aria-hidden="true"
            className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#85A928]"
          />
          {text}
        </li>
      ))}
    </ul>
  );
}
