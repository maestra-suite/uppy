import isDOMElement from "./isDOMElement.js";

/**
 * Find a DOM element.
 */
export default function findDOMElement(element, context) {
  if (context === void 0) {
    context = document;
  }
  if (typeof element === 'string') {
    return context.querySelector(element);
  }
  if (isDOMElement(element)) {
    return element;
  }
  return null;
}