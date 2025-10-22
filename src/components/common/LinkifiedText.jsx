const LinkifiedText = ({ text, className = '' }) => {
  if (!text) return null;

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <div className={className}>
      {parts.map((part, index) => {
        if (urlRegex.test(part)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 underline break-all"
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </div>
  );
};

export default LinkifiedText;