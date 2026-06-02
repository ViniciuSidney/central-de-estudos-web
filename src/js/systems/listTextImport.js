const LIST_SEPARATORS_REGEX = /[,;\n]+/;

export function parseItemsFromListText(rawText) {
  const text = rawText.trim();

  if (!text) {
    return {
      items: [],
      errors: ["Nenhum texto foi informado."],
    };
  }

  const items = text
    .split(LIST_SEPARATORS_REGEX)
    .map((item) => normalizeItemName(item))
    .filter(Boolean);

  const uniqueItems = [];
  const duplicatedItems = [];

  items.forEach((item) => {
    const alreadyExists = uniqueItems.some((currentItem) => {
      return compareNames(currentItem, item);
    });

    if (alreadyExists) {
      duplicatedItems.push(item);
      return;
    }

    uniqueItems.push(item);
  });

  return {
    items: uniqueItems,
    duplicatedItems,
    errors: [],
  };
}

export function compareNames(firstName, secondName) {
  return normalizeComparableName(firstName) === normalizeComparableName(secondName);
}

function normalizeItemName(item) {
  return item.trim().replace(/\s+/g, " ");
}

function normalizeComparableName(name) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}