var scannedItems = []; // Array to hold scanned items
var debounceTimeout;

// Function to start QR scanning
function startScanner() {
  var qrScannerDiv = document.getElementById('qr-scanner');
  var serialField = document.getElementById('serial');
  var qrReader = new Html5Qrcode("qr-reader");

  qrScannerDiv.style.display = 'block'; // Show the QR scanner
  serialField.style.display = 'none';  // Hide the manual serial number input field

  // Start scanning the QR code with the mobile camera
  qrReader.start(
    { facingMode: "environment" }, // Use back camera
    {
      fps: 10, // Frame rate
      qrbox: 250, // Scanner box size
    },
    function(decodedText, decodedResult) {
      // When a QR code is scanned, pass the scanned text (serial number) to the scanSerial function
      serialField.value = decodedText;  // Set scanned serial number to input field
      scanSerial();  // Call the existing scanSerial function to process the serial number
      qrReader.stop();  // Stop scanning once the barcode is found
      qrScannerDiv.style.display = 'none';  // Hide the QR scanner
      serialField.style.display = 'block';  // Show the manual serial number input field
    },
    function(errorMessage) {
      console.log(errorMessage);  // Log any scanning error
    }
  );
}

// Function to stop QR scanning
function stopScanner() {
  var qrReader = new Html5Qrcode("qr-reader");
  qrReader.stop();  // Stop the scanner
  document.getElementById('qr-scanner').style.display = 'none';  // Hide the QR scanner
  document.getElementById('serial').style.display = 'block';  // Show the manual serial number input field
}

// Function to handle scanning or entering a serial number
function scanSerial() {
  var serialNumber = document.getElementById('serial').value.trim();

  if (serialNumber === "") {
    document.getElementById('product-result').innerHTML = '';
    return;
  }

  var scriptURL = "https://script.google.com/macros/s/AKfycby96CLqLkw8tT9UdUl7estGo16gkvSZ3aC5Axktrc4R6xKDmWuDckH7FMkY5mqJrZVO/exec";

  $.get(scriptURL, { serial: serialNumber }, function(response) {
    if (response === "Product Not Found") {
      document.getElementById('product-result').innerHTML = response;
    } else {
      document.getElementById('product-result').innerHTML = "Product: " + response;

      // Fix for handling long product names and serial numbers
      var productDetails = splitProductAndSerial(response);
      var productName = productDetails.productName;
      var fullSerial = productDetails.serialNumber;

      // Add to the scanned items table
      addToScannedItems(productName, fullSerial);
      clearSerialField();  // Clear the serial number field after scanning
    }
  }).fail(function() {
    alert("Error while fetching the product information.");
  });
}

// Function to split the product name and serial number correctly
function splitProductAndSerial(response) {
  var productName = "";
  var fullSerial = "";
  
  var serialMatch = response.match(/([A-Za-z0-9-]+)$/);
  
  if (serialMatch) {
    fullSerial = serialMatch[0];
    productName = response.slice(0, response.lastIndexOf(fullSerial)).trim();
  } else {
    productName = response;
  }
  
  return {
    productName: productName,
    serialNumber: fullSerial
  };
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

  var scriptURL = "https://script.google.com/macros/s/AKfycbwEA2Bl97VGfQomNHTPS1NjMc3yaPHYr9EcnRO-14t2aCnCd9QBsiRnfD91CNMhB7mX/exec";
  $.post(scriptURL, {
    sonumber: sonumber,
    items: JSON.stringify(scannedItems)
  }, function(response) {
    alert("All items submitted successfully!");
    scannedItems = [];
    updateScannedItemsTable();
    clearSonumberField();
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
    }, 500);
  }
});

// Clear the serial number input field after scanning
function clearSerialField() {
  document.getElementById('serial').value = '';
}

// Clear the SO number field after submission
function clearSonumberField() {
  document.getElementById('sonumber').value = '';
}
