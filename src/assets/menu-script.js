$(document).ready(function () {

  // Setup filtering with dropdowns.
  var $filterSelects = $('.filter-grid select');
  var performFilter = function () {
    var filterVal = ($(this).val() == '*') ? '*' : '.' + $(this).val();
    $container.isotope({ filter: filterVal });
  };
  $filterSelects.on('change', performFilter);

  // Get the add-to-cart buttons
  const addToCartButtons = document.querySelectorAll('.js-add-to-cart');

  // Get the cart element
  const cartElement = document.querySelector('.cart');

  // Function to handle adding a product to the cart
  function addToCart(event) {
    // Get the current cart item count
    const cartItemCount = parseInt(cartElement.dataset.itemNum);

    // Get the parent grid-product element
    const productElement = event.target.closest('.grid-product');

    // Get the add-to-cart button
    const addToCartButton = productElement.querySelector('.js-add-to-cart');

    // Disable the add-to-cart button
    addToCartButton.disabled = true;

    // Show the notification above the product
    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.textContent = 'Product added to cart!';
    productElement.insertBefore(notification, productElement.firstChild);

    // Remove the notification after 3 seconds
    setTimeout(() => {
      notification.remove();

      // Update the cart item count
      cartElement.dataset.itemNum = cartItemCount + 1;

      // Enable the add-to-cart button
      addToCartButton.disabled = false;
    }, 3000);
  }

  // Add event listeners to the add-to-cart buttons
  addToCartButtons.forEach(button => {
    button.addEventListener('click', addToCart);
  });

  // Function to handle closing the notification
  function closeNotification() {
    this.parentNode.remove();
  }

  // Get the close buttons for notifications
  const closeButtons = document.querySelectorAll('.notification .close');

  // Add event listeners to the close buttons
  closeButtons.forEach(button => {
    button.addEventListener('click', closeNotification);
  });

  // Cart Slide Down
  var $cartToggle = $('.js-toggle-cart');
  var performCartToggle = function () {
    $('.cart').toggleClass('show-cart');
  };
  $cartToggle.on('click', performCartToggle);

  // Function for manipulating a sibling input of type "number"
  var manipulateNumberInput = function (e) {
    e.preventDefault(); // Prevent default action.
    var $numberInput = $(this).siblings('input[type=number]'),
      currentValue = $numberInput.val() !== '' ? $numberInput.val() : 1,
      adjustedValue = parseInt(currentValue) + ($(this).hasClass('plus') ? 1 : -1);
    $numberInput.val(adjustedValue).trigger('change'); // Adjust the number input value, trigger onChange.
  };

  // Runs onchange to keep numbers between max/min values.
  var validateNumberInput = function (e) {
    var $numberInput = $(this),
      currentValue = parseInt($numberInput.val()),
      minimumValue = parseInt($(this).attr('min')),
      maximumValue = parseInt($(this).attr('max'));
    if (currentValue < minimumValue) $numberInput.val(minimumValue);
    if (currentValue > maximumValue) $numberInput.val(maximumValue);
  };

  // Find number controls, attach click events.
  var $numberControls = $('.js-number-control');
  $numberControls.on('click', manipulateNumberInput);

  // Attach validation listeners.
  var $numberInputs = $('input[type=number]');
  $numberInputs.on('change', validateNumberInput);
});
