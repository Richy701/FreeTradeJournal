// Google Translate (and similar page translators) replace text nodes with
// <font> wrappers. React still holds the original nodes, so its next
// removeChild / insertBefore on that text throws NotFoundError, the error
// boundary catches it and the whole page is replaced by the error screen
// (React issue #11538). Non-English users hit this on /onboarding, /trades and
// /dashboard. Translation should never be able to crash the app, so make the
// two DOM calls tolerate a node that has been moved out from under React.
// Worst case a translated string lingers until the next full render.
// Reproduction: e2e/harness/translate-crash-check.mjs

export function installTranslateDomGuard() {
  if (typeof Node !== 'function' || !Node.prototype) return

  const originalRemoveChild = Node.prototype.removeChild
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      // Translate re-parented it: remove it from wherever it lives now.
      child.parentNode?.removeChild(child)
      return child
    }
    return originalRemoveChild.call(this, child) as T
  }

  const originalInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function <T extends Node>(this: Node, newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      // The reference node is gone from this parent: append instead of throwing.
      return originalInsertBefore.call(this, newNode, null) as T
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T
  }
}
