import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  Timestamp,
  Unsubscribe,
  limit,
} from "firebase/firestore";
import { auth, db } from "./firebase";

// --- Auth ---

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

export function onAuthChange(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

export async function signUp(email: string, password: string, displayName: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, "users", cred.user.uid), {
    email: email.toLowerCase(),
    displayName: displayName.trim(),
    avatarUrl: null,
    createdAt: Timestamp.now(),
  });
  return cred.user;
}

export async function signIn(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);

  // Create user profile if first time
  const snap = await getDoc(doc(db, "users", cred.user.uid));
  if (!snap.exists()) {
    await setDoc(doc(db, "users", cred.user.uid), {
      email: cred.user.email || "",
      displayName: cred.user.displayName || "",
      avatarUrl: cred.user.photoURL || null,
      createdAt: Timestamp.now(),
    });
  }

  return cred.user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export type UserSettings = {
  measurementSystem: "metric" | "imperial";
  strikeStyle: "strikethrough" | "fade" | "checkmark" | "hide";
  defaultQtyUnit: string;
  sortCheckedToBottom: boolean;
  confirmBeforeDelete: boolean;
};

const DEFAULT_SETTINGS: UserSettings = {
  measurementSystem: "imperial",
  strikeStyle: "strikethrough",
  defaultQtyUnit: "",
  sortCheckedToBottom: true,
  confirmBeforeDelete: true,
};

export async function getMe() {
  const user = auth.currentUser;
  if (!user) return null;
  const snap = await getDoc(doc(db, "users", user.uid));
  const data = snap.data() as any;
  return {
    id: user.uid,
    email: user.email || "",
    display_name: data?.displayName || "",
    avatar_url: data?.avatarUrl,
    settings: { ...DEFAULT_SETTINGS, ...(data?.settings || {}) } as UserSettings,
  };
}

export async function updateProfile(displayName: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  await updateDoc(doc(db, "users", user.uid), {
    displayName: displayName.trim(),
    updatedAt: Timestamp.now(),
  });
}

// --- Stores (custom aisle order per store) ---

export type Store = {
  name: string;
  aisleOrder: string[]; // category names in store aisle order
};

export async function getStores(): Promise<Store[]> {
  const user = auth.currentUser;
  if (!user) return [];
  const snap = await getDoc(doc(db, "users", user.uid));
  return snap.data()?.stores || [];
}

export async function saveStores(stores: Store[]): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  await updateDoc(doc(db, "users", user.uid), { stores });
}

export async function updateSettings(settings: Partial<UserSettings>) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const updates: Record<string, any> = {};
  for (const [key, value] of Object.entries(settings)) {
    updates[`settings.${key}`] = value;
  }
  await updateDoc(doc(db, "users", user.uid), updates);
}

// --- Lists ---

export async function fetchLists() {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    collection(db, "lists"),
    where("memberIds", "array-contains", user.uid)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      name: data.name,
      type: data.type,
      folder: data.folder || null,
      icon: data.icon || "shopping-cart",
      color: data.color || "#4F46E5",
      member_count: (data.memberIds || []).length,
    };
  });
}

export async function createList(name: string, folder?: string, icon?: string, color?: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const ref = await addDoc(collection(db, "lists"), {
    name: name.trim(),
    type: "shopping",
    folder: folder?.trim() || null,
    icon: icon || "shopping-cart",
    color: color || "#4F46E5",
    createdBy: user.uid,
    memberIds: [user.uid],
    memberRoles: { [user.uid]: "owner" },
    createdAt: Timestamp.now(),
  });
  return { id: ref.id, name: name.trim() };
}

export async function updateListTheme(listId: string, icon: string, color: string): Promise<void> {
  await updateDoc(doc(db, "lists", listId), { icon, color });
}

export async function updateListFolder(listId: string, folder: string | null): Promise<void> {
  await updateDoc(doc(db, "lists", listId), { folder });
}

export async function getList(id: string) {
  const snap = await getDoc(doc(db, "lists", id));
  if (!snap.exists()) throw new Error("List not found");
  const data = snap.data() as any;
  return { id: snap.id, name: data.name, type: data.type, createdBy: data.createdBy };
}

export async function deleteList(id: string) {
  await deleteDoc(doc(db, "lists", id));
}

// --- List Items ---

export async function fetchListItems(listId: string) {
  const q = query(
    collection(db, "lists", listId, "items"),
    orderBy("sortOrder", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      name: data.name,
      quantity: data.quantity || "1",
      category: data.category || null,
      checked: data.checked || false,
      sort_order: data.sortOrder || 0,
      checkedBy: data.checkedBy || null,
      price: data.price || null,
      note: data.note || null,
      photoUrl: data.photoUrl || null,
    };
  });
}

export function subscribeToListItems(
  listId: string,
  callback: (items: any[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "lists", listId, "items"),
    orderBy("sortOrder", "asc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function addListItem(
  listId: string,
  item: { name: string; quantity?: string; category?: string | null; sort_order?: number; price?: number | null; note?: string | null; photoUrl?: string | null }
) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  return addDoc(collection(db, "lists", listId, "items"), {
    name: item.name,
    quantity: item.quantity || "1",
    category: item.category || null,
    checked: false,
    checkedBy: null,
    sortOrder: item.sort_order || 0,
    price: item.price || null,
    note: item.note || null,
    photoUrl: item.photoUrl || null,
    createdBy: user.uid,
    createdAt: Timestamp.now(),
  });
}

export async function updateListItem(
  listId: string,
  itemId: string,
  updates: Record<string, any>
) {
  // Map snake_case from screens to camelCase for Firestore
  const mapped: Record<string, any> = {};
  if ("checked" in updates) mapped.checked = updates.checked;
  if ("checked_by" in updates) mapped.checkedBy = updates.checked_by;
  if ("name" in updates) mapped.name = updates.name;
  if ("quantity" in updates) mapped.quantity = updates.quantity;
  if ("category" in updates) mapped.category = updates.category;
  if ("sort_order" in updates) mapped.sortOrder = updates.sort_order;
  if ("price" in updates) mapped.price = updates.price;
  if ("note" in updates) mapped.note = updates.note;
  if ("photoUrl" in updates) mapped.photoUrl = updates.photoUrl;
  mapped.updatedAt = Timestamp.now();

  await updateDoc(doc(db, "lists", listId, "items", itemId), mapped);
}

export async function deleteListItem(listId: string, itemId: string) {
  await deleteDoc(doc(db, "lists", listId, "items", itemId));
}

// --- Invites ---

export async function createInvite(listId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  // Check for existing unexpired invite
  const q = query(
    collection(db, "invites"),
    where("listId", "==", listId),
    where("usedBy", "==", null)
  );
  const snap = await getDocs(q);
  const now = new Date();
  const existing = snap.docs.find(
    (d) => d.data().expiresAt.toDate() > now
  );
  if (existing) return { code: existing.data().code };

  // Generate 8-char code
  const code = Math.random().toString(36).substring(2, 10);
  await addDoc(collection(db, "invites"), {
    listId,
    code,
    createdBy: user.uid,
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    usedBy: null,
    usedAt: null,
    createdAt: Timestamp.now(),
  });
  return { code };
}

export async function joinByInvite(code: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const q = query(
    collection(db, "invites"),
    where("code", "==", code.trim()),
    where("usedBy", "==", null)
  );
  const snap = await getDocs(q);
  if (snap.empty) throw new Error("Invalid or expired invite code");

  const inviteDoc = snap.docs[0];
  const invite = inviteDoc.data();
  if (invite.expiresAt.toDate() < new Date()) {
    throw new Error("Invite code has expired");
  }

  const listId = invite.listId;

  // Add user to the list's memberIds
  await updateDoc(doc(db, "lists", listId), {
    memberIds: arrayUnion(user.uid),
    [`memberRoles.${user.uid}`]: "member",
  });

  // Mark invite as used
  await updateDoc(inviteDoc.ref, {
    usedBy: user.uid,
    usedAt: Timestamp.now(),
  });

  return { list_id: listId };
}

// --- Pantry ---

export async function fetchPantryItems() {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    collection(db, "pantryItems"),
    where("userId", "==", user.uid),
    orderBy("name", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      name: data.name,
      quantity: data.quantity || "1",
      unit: data.unit || null,
      category: data.category || null,
      expiry_date: data.expiryDate || null,
    };
  });
}

export async function addPantryItem(item: {
  name: string;
  quantity?: string;
  unit?: string;
  category?: string;
  expiry_date?: string;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  return addDoc(collection(db, "pantryItems"), {
    userId: user.uid,
    name: item.name.trim(),
    quantity: item.quantity || "1",
    unit: item.unit || null,
    category: item.category || null,
    expiryDate: item.expiry_date || null,
    createdAt: Timestamp.now(),
  });
}

export async function getPantryItem(id: string) {
  const snap = await getDoc(doc(db, "pantryItems", id));
  if (!snap.exists()) return null;
  const data = snap.data() as any;
  return {
    id: snap.id,
    name: data.name,
    quantity: data.quantity || "1",
    unit: data.unit || null,
    category: data.category || null,
    expiry_date: data.expiryDate || null,
  };
}

export async function updatePantryItem(id: string, updates: Record<string, any>) {
  const mapped: Record<string, any> = { updatedAt: Timestamp.now() };
  if ("name" in updates) mapped.name = updates.name;
  if ("quantity" in updates) mapped.quantity = updates.quantity;
  if ("unit" in updates) mapped.unit = updates.unit;
  if ("category" in updates) mapped.category = updates.category;
  if ("expiry_date" in updates) mapped.expiryDate = updates.expiry_date;

  await updateDoc(doc(db, "pantryItems", id), mapped);
}

export async function deletePantryItem(id: string) {
  await deleteDoc(doc(db, "pantryItems", id));
}

// --- Meals ---

export async function fetchMeals(from: string, to: string) {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    collection(db, "mealPlans"),
    where("userId", "==", user.uid),
    where("date", ">=", from),
    where("date", "<=", to),
    orderBy("date", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      date: data.date,
      meal_type: data.mealType,
      recipe_name: data.recipeName,
      notes: data.notes,
    };
  });
}

export async function getMeal(id: string) {
  const snap = await getDoc(doc(db, "mealPlans", id));
  if (!snap.exists()) throw new Error("Meal not found");
  const data = snap.data();
  return {
    id: snap.id,
    date: data.date,
    meal_type: data.mealType,
    recipe_name: data.recipeName,
    notes: data.notes,
  };
}

export async function addMeal(meal: {
  date: string;
  meal_type: string;
  recipe_name: string;
  notes?: string;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  return addDoc(collection(db, "mealPlans"), {
    userId: user.uid,
    date: meal.date,
    mealType: meal.meal_type,
    recipeName: meal.recipe_name.trim(),
    notes: meal.notes || null,
    createdAt: Timestamp.now(),
  });
}

export async function deleteMeal(id: string) {
  await deleteDoc(doc(db, "mealPlans", id));
}

export async function addIngredientsToList(
  mealId: string,
  listId: string,
  ingredients: string[]
) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  // Get current max sort order
  const items = await fetchListItems(listId);
  let sortOrder = items.length > 0
    ? Math.max(...items.map((i: any) => i.sortOrder || 0))
    : 0;

  for (const name of ingredients) {
    if (!name.trim()) continue;
    sortOrder++;
    await addDoc(collection(db, "lists", listId, "items"), {
      name: name.trim(),
      quantity: "1",
      category: null,
      checked: false,
      checkedBy: null,
      sortOrder,
      createdBy: user.uid,
      createdAt: Timestamp.now(),
    });
  }
}

// --- Push Tokens ---

export async function registerPushToken(token: string) {
  const user = auth.currentUser;
  if (!user) return;
  await updateDoc(doc(db, "users", user.uid), { pushToken: token });
}

// Re-export for backward compat with screens that import getStoredUser
export async function getStoredUser() {
  const user = auth.currentUser;
  if (!user) return null;
  return { id: user.uid, email: user.email };
}

// --- Favorites ---
// Stored as an array of { name, category } on the user doc

export type FavoriteItem = {
  name: string;
  category: string;
};

export async function getFavorites(): Promise<FavoriteItem[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const snap = await getDoc(doc(db, "users", user.uid));
  return snap.data()?.favorites || [];
}

export async function addFavorite(item: FavoriteItem): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  await updateDoc(doc(db, "users", user.uid), {
    favorites: arrayUnion({ name: item.name, category: item.category }),
  });
}

export async function removeFavorite(item: FavoriteItem): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  await updateDoc(doc(db, "users", user.uid), {
    favorites: arrayRemove({ name: item.name, category: item.category }),
  });
}

export async function isFavorite(itemName: string): Promise<boolean> {
  const favorites = await getFavorites();
  return favorites.some((f) => f.name.toLowerCase() === itemName.toLowerCase());
}

// --- Previous List Items ---
// Gets items from other lists the user is a member of

export async function getOtherLists(excludeListId: string) {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    collection(db, "lists"),
    where("memberIds", "array-contains", user.uid)
  );
  const snap = await getDocs(q);
  return snap.docs
    .filter((d) => d.id !== excludeListId)
    .map((d) => {
      const data = d.data() as any;
      return { id: d.id, name: data.name };
    });
}

export async function getItemsFromList(listId: string) {
  const q = query(
    collection(db, "lists", listId, "items"),
    orderBy("sortOrder", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      name: data.name,
      quantity: data.quantity || "1",
      category: data.category || null,
    };
  });
}

// --- Recipes ---

export type RecipeIngredient = {
  name: string;
  amount: string;
  unit: string;
};

export type Recipe = {
  id: string;
  title: string;
  description: string;
  servings: number;
  prepTime: string;
  cookTime: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  photoUrl: string | null;
  sourceUrl: string | null;
  collections: string[];
  createdAt: any;
};

export async function fetchRecipes(): Promise<Recipe[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    collection(db, "recipes"),
    where("userId", "==", user.uid),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as any;
    return { id: d.id, ...data } as Recipe;
  });
}

export async function getRecipe(id: string): Promise<Recipe> {
  const snap = await getDoc(doc(db, "recipes", id));
  if (!snap.exists()) throw new Error("Recipe not found");
  return { id: snap.id, ...snap.data() } as Recipe;
}

export async function addRecipe(recipe: Omit<Recipe, "id" | "createdAt">): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const ref = await addDoc(collection(db, "recipes"), {
    ...recipe,
    userId: user.uid,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function updateRecipe(id: string, updates: Partial<Recipe>): Promise<void> {
  const { id: _, createdAt, ...rest } = updates as any;
  await updateDoc(doc(db, "recipes", id), { ...rest, updatedAt: Timestamp.now() });
}

export async function deleteRecipe(id: string): Promise<void> {
  await deleteDoc(doc(db, "recipes", id));
}

export async function fetchRecipeCollections(): Promise<string[]> {
  const recipes = await fetchRecipes();
  const all = recipes.flatMap((r) => r.collections || []);
  return [...new Set(all)].sort();
}

export async function addRecipeIngredientsToList(
  recipeId: string,
  listId: string,
  scale: number = 1
): Promise<void> {
  const recipe = await getRecipe(recipeId);
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const existingItems = await fetchListItems(listId);
  let sortOrder = existingItems.length > 0
    ? Math.max(...existingItems.map((i: any) => i.sort_order || 0))
    : 0;

  for (const ing of recipe.ingredients) {
    sortOrder++;
    const scaledAmount = ing.amount ? String(parseFloat(ing.amount) * scale || ing.amount) : "1";
    const name = ing.unit ? `${ing.name} (${scaledAmount} ${ing.unit})` : ing.name;
    await addDoc(collection(db, "lists", listId, "items"), {
      name,
      quantity: scaledAmount,
      category: null,
      checked: false,
      checkedBy: null,
      sortOrder,
      createdBy: user.uid,
      createdAt: Timestamp.now(),
    });
  }
}
