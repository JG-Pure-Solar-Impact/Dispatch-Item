var scannedItems = []; // Array to hold scanned items
var debounceTimeout;
var video = document.getElementById('scanner-video');
var canvas = document.getElementById('scanner-canvas');
var context = canvas.getContext('2d');

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

  var serialMatch = response.match(/([A-Za-z0-9-]+)$/); // Matching the serial number pattern (alphanumeric + dashes)
  
  if (serialMatch) {
    fullSerial = serialMatch[0];
    productName = response.slice(0, response.lastIndexOf(fullSerial)).trim(); // Extract everything before the serial number
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

// Start the camera and begin scanning QR/Barcode
function startScanner() {
  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then(function(stream) {
        video.srcObject = stream;
        video.setAttribute("playsinline", true);
        video.play();
        scanQRCode();
      }).catch(function(err) {
        console.log("Error accessing camera: " + err);
      });
  }
}

// Function to scan QR/Barcode from the video feed
function scanQRCode() {
  setInterval(function() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      var code = jsQR(imageData.data, canvas.width, canvas.height);
      
      if (code) {
        document.getElementById('serial').value = code.data;
        scanSerial();  // Trigger the scan function to process the serial number
      }
    }
  }, 500);
}

// Start the scanner when the page is ready
startScanner();
 
