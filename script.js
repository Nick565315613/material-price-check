const cities = ["Fortsterling", "Lymhurst", "Bridgewatch", "Martlock", "Thetford"];
const materials = ["CLOTH", "LEATHER", "METALBAR", "PLANKS"];

// Replicates the Go generateApiURL function
function generateApiURL(material) {
  return (
    "https://west.albion-online-data.com/api/v2/stats/prices/" +
    `T4_${material},T4_${material}_LEVEL1@1,T4_${material}_LEVEL2@2,T4_${material}_LEVEL3@3,T4_${material}_LEVEL4@4,` +
    `T5_${material},T5_${material}_LEVEL1@1,T5_${material}_LEVEL2@2,T5_${material}_LEVEL3@3,T5_${material}_LEVEL4@4,` +
    `T6_${material},T6_${material}_LEVEL1@1,T6_${material}_LEVEL2@2,T6_${material}_LEVEL3@3,T6_${material}_LEVEL4@4,` +
    `T7_${material},T7_${material}_LEVEL1@1,T7_${material}_LEVEL2@2,T7_${material}_LEVEL3@3,T7_${material}_LEVEL4@4,` +
    `T8_${material},T8_${material}_LEVEL1@1,T8_${material}_LEVEL2@2,T8_${material}_LEVEL3@3,T8_${material}_LEVEL4@4` +
    "?locations=FortSterling,Bridgewatch,Martlock,Thetford,Lymhurst&qualities=1"
  );
}

// Replicates the Go getItemName function
function getItemName(originalId) {
  const formatted = originalId.split("_");
  let item = formatted.slice(1).join("_");
  item = item.split("_LEVEL")[0];
  return item;
}

// Replicates the Go getItemTier function
function getItemTier(originalId) {
  const formatted = originalId.split("_");
  const tier = parseInt(formatted[0].replace("T", ""), 10);
  let item = formatted.slice(1).join("_");
  const parts = item.split("_LEVEL");

  let enchant = 0;
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1];
    enchant = parseInt(lastPart.split("@")[1], 10);
  }

  return { tier, enchant };
}

// Replicates the Go ParseData function
function parseData(apiItems) {
  const formattedItems = [];

  for (let i = 0; i < apiItems.length - 1; i += 5) {
    const name = getItemName(apiItems[i].item_id);
    const { tier, enchant } = getItemTier(apiItems[i].item_id);

    const prices = {
      Fortsterling: 0,
      Lymhurst: 0,
      Bridgewatch: 0,
      Martlock: 0,
      Thetford: 0,
    };

    for (let j = i; j < i + 5 && j < apiItems.length; j++) {
      switch (apiItems[j].city) {
        case "Fort Sterling":
          prices.Fortsterling = apiItems[j].sell_price_min;
          break;
        case "Lymhurst":
          prices.Lymhurst = apiItems[j].sell_price_min;
          break;
        case "Bridgewatch":
          prices.Bridgewatch = apiItems[j].sell_price_min;
          break;
        case "Martlock":
          prices.Martlock = apiItems[j].sell_price_min;
          break;
        case "Thetford":
          prices.Thetford = apiItems[j].sell_price_min;
          break;
      }
    }

    formattedItems.push({
      Name: name,
      Tier: tier,
      Enchant: enchant,
      Quality: apiItems[i].quality,
      SellPrice: prices,
    });
  }

  return formattedItems;
}

// Fetches prices directly from the Albion Online API (no Go backend needed)
async function callAPI() {
  const statusEl = document.getElementById("status");
  statusEl.textContent = "Fetching prices...";

  try {
    const allItems = [];

    // Fetch all materials in parallel
    const responses = await Promise.all(
      materials.map((material) => fetch(generateApiURL(material)))
    );

    for (const res of responses) {
      if (!res.ok) {
        throw new Error(`API request failed with status ${res.status}`);
      }
      const apiItems = await res.json();
      const parsed = parseData(apiItems);
      allItems.push(...parsed);
    }

    const tableBody = document.querySelector("#data-table tbody");
    tableBody.innerHTML = "";

    console.log(allItems);
    allItems.forEach((item) => {
      addTableRow(item.Name, item.Tier, item.Enchant, item.SellPrice);
    });

    statusEl.textContent = `Loaded ${allItems.length} items.`;
  } catch (err) {
    console.error("Error fetching prices:", err);
    statusEl.textContent = "Error fetching prices: " + err.message;
  }
}

function addTableRow(name, tier, enchant, priceData) {
  const table = document
    .getElementById("data-table")
    .getElementsByTagName("tbody")[0];
  const row = document.createElement("tr");

  const tdName = document.createElement("td");
  tdName.textContent = name;
  row.appendChild(tdName);

  const tdTier = document.createElement("td");
  tdTier.textContent = tier;
  row.appendChild(tdTier);

  const tdEnchant = document.createElement("td");
  tdEnchant.textContent = enchant;
  row.appendChild(tdEnchant);

  cities.forEach((city) => {
    const td = document.createElement("td");
    td.textContent = priceData?.[city] ?? "-1";
    row.appendChild(td);
  });
  table.appendChild(row);
}

