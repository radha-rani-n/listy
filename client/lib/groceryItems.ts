import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db, auth } from "./firebase";

// Organized to match typical grocery store aisle layout
export const GROCERY_BY_CATEGORY: Record<string, string[]> = {
  // Perimeter — fresh departments
  "Fruits & Vegetables": [
    "Apples", "Asparagus", "Avocados", "Bananas", "Basil", "Bell Peppers",
    "Blueberries", "Broccoli", "Brussels Sprouts", "Cabbage", "Carrots",
    "Cauliflower", "Celery", "Cherries", "Cilantro", "Corn", "Cucumbers",
    "Eggplant", "Garlic", "Ginger", "Grapes", "Green Beans", "Green Onions",
    "Herbs", "Jalapeños", "Kale", "Leeks", "Lemons", "Lettuce", "Limes",
    "Mangoes", "Mint", "Mushrooms", "Onions", "Oranges", "Parsley",
    "Peaches", "Pears", "Pineapple", "Potatoes", "Radishes", "Raspberries",
    "Romaine", "Rosemary", "Scallions", "Spinach", "Squash", "Strawberries",
    "Sweet Potatoes", "Thyme", "Tomatoes", "Watermelon", "Zucchini",
    "Salad Mix", "Coleslaw Mix", "Baby Carrots", "Cherry Tomatoes",
    "Arugula", "Beets", "Turnips", "Parsnips",
  ],
  "Meat & Seafood": [
    "Bacon", "Beef", "Chicken Breast", "Chicken Thighs", "Chicken Wings",
    "Ground Beef", "Ground Turkey", "Ham", "Hot Dogs", "Lamb",
    "Lamb Chops", "Pork Chops", "Pork Tenderloin", "Ribs", "Roast",
    "Salmon", "Sausage", "Shrimp", "Steak", "Tilapia", "Tuna",
    "Turkey", "Crab", "Lobster", "Meatballs", "Brisket",
    "Italian Sausage", "Bratwurst", "Cod", "Catfish", "Scallops",
  ],
  "Deli & Prepared": [
    "Deli Turkey", "Deli Ham", "Roast Beef Deli", "Salami", "Pepperoni",
    "Sliced Cheese", "Hummus", "Rotisserie Chicken", "Prepared Salad",
    "Coleslaw", "Potato Salad", "Macaroni Salad", "Guacamole",
    "Deli Rolls", "Sub Rolls",
  ],
  "Dairy & Eggs": [
    "Butter", "Cheddar Cheese", "Cottage Cheese", "Cream Cheese",
    "Creamer", "Eggs", "Greek Yogurt", "Half and Half", "Heavy Cream",
    "Milk", "Almond Milk", "Oat Milk", "Soy Milk", "Mozzarella",
    "Parmesan Cheese", "Shredded Cheese", "Sour Cream", "Whipped Cream",
    "Yogurt", "String Cheese", "Brie", "Feta Cheese", "Ricotta",
    "Egg Whites", "Buttermilk",
  ],
  "Bakery & Bread": [
    "Bagels", "Baguette", "Bread", "Burger Buns", "Cake", "Ciabatta",
    "Croissants", "Donuts", "English Muffins", "Flatbread",
    "French Bread", "Hot Dog Buns", "Muffins", "Naan", "Pastry",
    "Pie", "Pie Crust", "Pita Bread", "Rolls", "Rye Bread",
    "Sourdough", "Tortillas", "Wheat Bread", "White Bread", "Wraps",
  ],

  // Center aisles
  "Canned & Jarred": [
    "Black Beans", "Kidney Beans", "Chickpeas", "Pinto Beans",
    "Canned Corn", "Canned Tomatoes", "Diced Tomatoes", "Tomato Paste",
    "Tomato Sauce", "Marinara Sauce", "Pasta Sauce", "Salsa",
    "Chicken Broth", "Beef Broth", "Vegetable Broth",
    "Canned Tuna", "Canned Chicken", "Canned Soup",
    "Coconut Milk", "Evaporated Milk", "Condensed Milk",
    "Olives", "Pickles", "Sauerkraut", "Jalapeños Jarred",
    "Peanut Butter", "Jam", "Jelly", "Nutella", "Applesauce",
  ],
  "Pasta, Rice & Grains": [
    "Pasta", "Spaghetti", "Penne", "Macaroni", "Fettuccine",
    "Lasagna Noodles", "Egg Noodles", "Ramen", "Rice Noodles",
    "White Rice", "Brown Rice", "Jasmine Rice", "Basmati Rice",
    "Quinoa", "Couscous", "Oatmeal", "Grits",
    "Bread Crumbs", "Panko", "Stuffing Mix",
  ],
  "Baking & Spices": [
    "Flour", "Sugar", "Brown Sugar", "Powdered Sugar",
    "Baking Powder", "Baking Soda", "Cornstarch", "Yeast",
    "Vanilla Extract", "Cocoa Powder", "Chocolate Chips",
    "Salt", "Pepper", "Garlic Powder", "Onion Powder",
    "Paprika", "Cumin", "Chili Powder", "Oregano", "Cinnamon",
    "Nutmeg", "Bay Leaves", "Red Pepper Flakes", "Italian Seasoning",
    "Taco Seasoning", "Ranch Seasoning", "Everything Bagel Seasoning",
    "Sprinkles", "Food Coloring",
  ],
  "Oils, Vinegar & Condiments": [
    "Olive Oil", "Vegetable Oil", "Canola Oil", "Coconut Oil",
    "Sesame Oil", "Cooking Spray",
    "White Vinegar", "Apple Cider Vinegar", "Balsamic Vinegar",
    "Ketchup", "Mustard", "Mayo", "Mayonnaise",
    "Soy Sauce", "Hot Sauce", "BBQ Sauce", "Worcestershire Sauce",
    "Ranch Dressing", "Italian Dressing", "Salad Dressing",
    "Honey", "Maple Syrup", "Sriracha", "Teriyaki Sauce",
    "Tartar Sauce", "Steak Sauce",
  ],
  "Cereal & Breakfast": [
    "Cereal", "Granola", "Oatmeal", "Pancake Mix", "Waffle Mix",
    "Syrup", "Pop-Tarts", "Breakfast Bars", "Instant Oatmeal",
    "Grits", "Cream of Wheat",
  ],
  "Snacks & Chips": [
    "Almonds", "Cashews", "Cheese Crackers", "Chips", "Chocolate",
    "Cookies", "Crackers", "Dried Fruit", "Goldfish", "Granola Bars",
    "Gummy Bears", "Jerky", "Mixed Nuts", "Peanuts", "Popcorn",
    "Pretzels", "Trail Mix", "Rice Cakes", "Fruit Snacks",
    "Tortilla Chips", "Salsa Chips", "Veggie Chips", "Pita Chips",
  ],
  Beverages: [
    "Water", "Sparkling Water", "Soda", "Diet Soda",
    "Apple Juice", "Orange Juice", "Cranberry Juice", "Grape Juice",
    "Lemonade", "Iced Tea", "Kombucha",
    "Coffee", "Coffee Beans", "Coffee Grounds", "K-Cups",
    "Tea", "Green Tea", "Herbal Tea",
    "Energy Drinks", "Sports Drinks", "Coconut Water",
    "Beer", "Wine", "Seltzer",
  ],
  "Frozen Foods": [
    "Frozen Berries", "Frozen Vegetables", "Frozen Fruit",
    "Frozen Pizza", "Frozen Meals", "Frozen Burritos",
    "Frozen Chicken Nuggets", "Frozen Fish Sticks",
    "Frozen Waffles", "Frozen Pancakes",
    "French Fries", "Tater Tots", "Frozen Hash Browns",
    "Ice Cream", "Frozen Yogurt", "Popsicles", "Ice Cream Bars",
    "Frozen Pie Crust", "Frozen Bread Dough",
    "Frozen Shrimp", "Frozen Chicken",
  ],

  // Non-food aisles
  "Paper & Plastic": [
    "Paper Towels", "Toilet Paper", "Tissues", "Napkins",
    "Paper Plates", "Paper Cups", "Plastic Cups",
    "Aluminum Foil", "Cling Wrap", "Plastic Wrap", "Parchment Paper",
    "Ziploc Bags", "Trash Bags", "Garbage Bags", "Plastic Bags",
    "Sandwich Bags",
  ],
  "Cleaning Supplies": [
    "Dish Soap", "Dishwasher Detergent", "Sponges", "Steel Wool",
    "All-Purpose Cleaner", "Glass Cleaner", "Bleach",
    "Disinfectant Wipes", "Disinfectant Spray",
    "Laundry Detergent", "Dryer Sheets", "Fabric Softener",
    "Stain Remover", "Mop Pads", "Broom",
  ],
  "Personal Care": [
    "Shampoo", "Conditioner", "Body Wash", "Bar Soap", "Hand Soap",
    "Deodorant", "Antiperspirant",
    "Toothpaste", "Toothbrush", "Mouthwash", "Floss",
    "Razor", "Razors", "Shaving Cream",
    "Lotion", "Body Lotion", "Sunscreen", "Face Wash", "Moisturizer",
    "Hand Sanitizer", "Cotton Balls", "Cotton Swabs", "Q-Tips",
    "Lip Balm", "Chapstick", "Hair Gel", "Hair Spray",
    "Makeup Remover", "Tampons", "Pads", "Feminine Products",
    "Contact Solution", "Band-Aids", "Vitamins", "Pain Reliever",
    "Allergy Medicine", "Cold Medicine",
  ],
  Baby: [
    "Baby Food", "Baby Wipes", "Diapers", "Formula",
    "Baby Cereal", "Baby Snacks", "Sippy Cup", "Pacifier",
    "Baby Lotion", "Baby Shampoo", "Diaper Cream",
  ],
  Pet: [
    "Dog Food", "Cat Food", "Dog Treats", "Cat Treats",
    "Cat Litter", "Pet Shampoo", "Flea Treatment",
    "Dog Chews", "Pet Toys",
  ],
};

// Flat list of all items for autocomplete
export const ALL_GROCERY_ITEMS: string[] = Object.values(GROCERY_BY_CATEGORY).flat();

// Static reverse lookup
const _staticMap = new Map<string, string>();
for (const [category, items] of Object.entries(GROCERY_BY_CATEGORY)) {
  for (const item of items) {
    _staticMap.set(item.toLowerCase(), category);
  }
}

function getStaticCategory(itemName: string): string | null {
  const lower = itemName.toLowerCase().trim();
  const exact = _staticMap.get(lower);
  if (exact) return exact;

  for (const [knownItem, category] of _staticMap) {
    if (lower.includes(knownItem) || knownItem.includes(lower)) {
      return category;
    }
  }
  return null;
}

// ============================================================
// Per-user learned categories
// ============================================================

let _userOverrides: Record<string, string> = {};
let _overridesLoaded = false;

export async function loadUserOverrides(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    _userOverrides = snap.data()?.categoryOverrides || {};
    _overridesLoaded = true;
  } catch {
    _userOverrides = {};
  }
}

async function saveUserOverride(itemName: string, category: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const key = itemName.toLowerCase().trim();
  _userOverrides[key] = category;

  try {
    await updateDoc(doc(db, "users", user.uid), {
      [`categoryOverrides.${key}`]: category,
    });
  } catch {
    await setDoc(doc(db, "users", user.uid), {
      categoryOverrides: { [key]: category },
    }, { merge: true });
  }
}

// ============================================================
// Crowdsourced categories
// ============================================================

let _crowdsourcedCache: Record<string, string> = {};

async function getCrowdsourcedCategory(itemName: string): Promise<string | null> {
  const key = itemName.toLowerCase().trim();
  if (_crowdsourcedCache[key]) return _crowdsourcedCache[key];

  try {
    const snap = await getDoc(doc(db, "itemCategories", key));
    if (!snap.exists()) return null;

    const votes = snap.data().votes as Record<string, number>;
    let topCategory = "";
    let topCount = 0;
    for (const [cat, count] of Object.entries(votes)) {
      if (count > topCount) {
        topCategory = cat;
        topCount = count;
      }
    }

    if (topCategory) {
      _crowdsourcedCache[key] = topCategory;
      return topCategory;
    }
  } catch {
    // ignore
  }
  return null;
}

async function recordCrowdsourcedVote(itemName: string, category: string): Promise<void> {
  const key = itemName.toLowerCase().trim();
  const ref = doc(db, "itemCategories", key);

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { [`votes.${category}`]: increment(1) });
    } else {
      await setDoc(ref, { votes: { [category]: 1 } });
    }
    _crowdsourcedCache[key] = category;
  } catch {
    // ignore
  }
}

// ============================================================
// Main category resolution
// Priority: 1) User override  2) Crowdsourced  3) Static list  4) "Other"
// ============================================================

export function getCategoryForItem(itemName: string): string {
  const key = itemName.toLowerCase().trim();

  if (_userOverrides[key]) return _userOverrides[key];
  if (_crowdsourcedCache[key]) return _crowdsourcedCache[key];

  const staticCat = getStaticCategory(itemName);
  if (staticCat) return staticCat;

  return "Other";
}

export async function getCategoryForItemAsync(itemName: string): Promise<string> {
  const key = itemName.toLowerCase().trim();

  if (_userOverrides[key]) return _userOverrides[key];

  const crowd = await getCrowdsourcedCategory(itemName);
  if (crowd) return crowd;

  const staticCat = getStaticCategory(itemName);
  if (staticCat) return staticCat;

  return "Other";
}

export async function learnCategory(itemName: string, category: string): Promise<void> {
  if (category === "Other") return;

  await Promise.all([
    saveUserOverride(itemName, category),
    recordCrowdsourcedVote(itemName, category),
  ]);
}
