var scannedItems = []; // Array to hold scanned items
var debounceTimeout;

// Function to initialize QuaggaJS and start the barcode scanning
function startScanner() {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    console.log("Camera access granted!");

    // Initialize Quagga with barcode reader options
    Quagga.init({
      inputStream: {
        type: "LiveStream",
        target: document.getElementById('barcode-preview'), // Video element to show the stream
        constraints: {
          facingMode: "environment" // Use back camera on mobile (if available)
        }
      },
      decoder: {
        readers: ["code_128_reader", "ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader", "code_39_reader", "itf_reader", "qr_reader"] // Enable QR and various barcode types
      },
      locate: true,
      numOfWorkers: 4,
      debug: {
        drawBoundingBox: true, // Show bounding box for detected barcode
        showFrequency: true,
      }
    }, function(err) {
      if (err) {
        console.error("Error starting Quagga:", err);
        return;
      }
      Quagga.start(); // Start the scanner
      console.log("Quagga is now running");

      // Event listener for when Quagga detects a barcode or QR code
      Quagga.onDetected(function(result) {
        console.log("Barcode detected:", result); // Log the result for debugging
        var serialNumber = result.codeResult.code;
        
        // Update the serial number input with the detected barcode/QR
        document.getElementById('serial').value = serialNumber;
        
        // Call scanSerial() to process the serial number
        scanSerial();
      });
    });
  } else {
    alert("Your device does not support camera access.");
  }
}

// Start the scanner when the page loads
document.addEventListener('DOMContentLoaded', function() {
  startScanner();  // Start the scanner on page load
});

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
    scannedItems = [];  // Clear the scanned items list after submission
    updateScannedItemsTable();
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
