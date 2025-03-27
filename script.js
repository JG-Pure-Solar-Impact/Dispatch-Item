var scannedItems = []; // Array to hold scanned items
var debounceTimeout;

// Function to handle scanning or entering a serial number
function scanSerial() {
  var serialNumber = document.getElementById('serial').value.trim();

  if (serialNumber === "") {
    document.getElementById('product-result').innerHTML = '';
    return;
  }

  var scriptURL = "https://script.google.com/macros/s/AKfycbwEA2Bl97VGfQomNHTPS1NjMc3yaPHYr9EcnRO-14t2aCnCd9QBsiRnfD91CNMhB7mX/exec";

  $.get(scriptURL, { serial: serialNumber }, function(response) {
    if (response === "Product Not Found") {
      document.getElementById('product-result').innerHTML = response;
    } else {
      document.getElementById('product-result').innerHTML = "Product: " + response;
      addToScannedItems(response, serialNumber);
      clearSerialField();  // Clear the serial number field after scanning
    }
  }).fail(function() {
    alert("Error while fetching the product information.");
  });
}

// Function to add scanned item to the list
function addToScannedItems(productName, serialNumber) {
  var existingItem = scannedItems.find(item => item.serialNumber === serialNumber);
  if (existingItem) {
    alert("This serial number has already been scanned.");
    return;
  }

  var item = { productName: productName, serialNumber: serialNumber, quantity: 1 };
  scannedItems.push(item);
  updateScannedItemsTable();
}

// Update the table with scanned items
function updateScannedItemsTable() {
  var tableBody = document.getElementById('scanned-items-list');
  tableBody.innerHTML = ""; // Clear previous table rows

  scannedItems.forEach(function(item, index) {
    var row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.productName}</td>
      <td>${item.serialNumber}</td>
      <td><input type="number" value="${item.quantity}" onchange="updateQuantity(${index}, this.value)" /></td>
      <td><button onclick="removeItem(${index})">Remove</button></td>
    `;
    tableBody.appendChild(row);
  });
}

// Update quantity in the scanned items array
function updateQuantity(index, newQuantity) {
  if (!isNaN(newQuantity) && newQuantity > 0) {
    scannedItems[index].quantity = newQuantity;
  } else {
    alert("Invalid quantity.");
  }
}

// Remove an item from the scanned items list
function removeItem(index) {
  scannedItems.splice(index, 1);
  updateScannedItemsTable();
}

// Submit all scanned items to Google Apps Script
function submitAll() {
  var sonumber = document.getElementById('sonumber').value.trim();
  if (sonumber === "") {
    alert("Please enter the SO number.");
    return;
  }

  // Send all scanned items to Apps Script for processing
  var scriptURL = "https://script.google.com/macros/s/AKfycbwEA2Bl97VGfQomNHTPS1NjMc3yaPHYr9EcnRO-14t2aCnCd9QBsiRnfD91CNMhB7mX/exec";
  $.post(scriptURL, {
    sonumber: sonumber,
    items: JSON.stringify(scannedItems)
  }, function(response) {
    alert("All items submitted successfully!");
    scannedItems = [];  // Clear the scanned items list after submission
    updateScannedItemsTable();  // Update the table to reflect cleared items
    clearSonumberField();  // Clear the SO number field after submission
  }).fail(function() {
    alert("Error while submitting the items.");
  });
}

// Debounce input for serial number
document.getElementById('serial').addEventListener('input', function() {
  clearTimeout(debounceTimeout);
  let serialNumber = this.value.trim();
  if (serialNumber.length > 0) {
    debounceTimeout = setTimeout(function() {
      scanSerial();
    }, 500);  // Wait for 500ms after typing before triggering search
  }
});

// Clear the serial number input field after scanning
function clearSerialField() {
  document.getElementById('serial').value = '';  // Clear the serial number field
}

// Clear the SO number field after submission
function clearSonumberField() {
  document.getElementById('sonumber').value = '';  // Clear the SO number field
}
