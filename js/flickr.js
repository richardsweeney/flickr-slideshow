/**
 *
 * flickr.js
 *
 * Search for images in Flickr, select images and create
 * a lightbox style slideshow with selected images.
 *
 * Richard Sweeney : http://richardsweeney.com : @richardsweeney
 * Public Domain.
 */

var flickr = {
	settings: {
		key: 'b54580f369a7eeebecb2004dc429d08f',
		photosPerPage: 32,
		url: 'http://api.flickr.com/services/rest/?',
		safeSearch: 1, // 1 = safe, 2 = moderate, 3 = restricted: dependant on user tagging images!
		timeout: 4000 // speed of the slideshow
	},
	page: 1, // current page for search query
	tags: '', // current search terms
	results: {}, // container for JSON results
	galleryImages: [], // array to house gallery image ids
	currentImageIndex: 0, // Incremental image id (for the slideshow)

	/**
	 * Attach eventlistener to submit button when the DOM is ready
	 */
	load: function() {
		var submit = document.getElementById('flickr-submit');
		submit.addEventListener('click', function (e) {
			flickr.page = 1;
			flickr.sortSearch();
			e.preventDefault();
		});
		flickr.centerContent();
		flickr.randomPlaceholderText();
	},

	/**
	 * Shows a random placeholder text
	 */
	randomPlaceholderText: function() {
		var input = document.getElementById('flickr-input'),
				terms = ['Butterflies', 'Rainbows', 'Apples', 'Bicycles', 'Cats', 'Tomatoes', 'Computers', 'Star Wars', 'Cinema', 'Ice Cream'],
				randomNumber = Math.floor(Math.random() * terms.length);
		input.setAttribute('placeholder', terms[randomNumber]);
	},

	/**
	 * Check if an element exists in the DOM
	 * & remove it if it does
	 */
	remove: function(element) {
		if (typeof(element) != 'undefined' && element != null) {
			element.parentNode.removeChild(element);
		}
	},

	/**
   * Center the opening screen, hide + show search div
   */
	centerContent: function() {
		var that = this,
				winHeight = window.innerHeight,
				container = document.getElementsByClassName('search-container')[0],
				top = (winHeight / 2) - (container.offsetHeight / 2);
		container.style.paddingTop = top - 100;
		window.setTimeout(function () {
			container.classList.add('visible-search');
			document.getElementById('flickr-input').focus();
		}, 100);
	},

	/**
	 * Get values from input + perform search query if not empty
	 */
	sortSearch: function() {
		var input = document.getElementById('flickr-input');
		flickr.tags = input.value;
		if (flickr.tags === '') {
			var searchContainer = document.getElementsByClassName('search-container')[0],
					p = document.createElement('p');
			p.id = 'empty-search';
			p.innerHTML = 'Please add a search term!';
			searchContainer.appendChild(p);
			input.focus();
		} else {
			flickr.getResults();
		}
	},

	/**
	 * Get results from flickr API via AJAX
	 * Prints a list of returned results to the DOM
	 */
	getResults: function() {
		var that = this,
				searchContainer = document.getElementsByClassName('search-container')[0],
				resultsContainer =  document.getElementById('results-container'),
				emptyPara = document.getElementById('empty-search'),
				url = that.settings.url + 'api_key=' + that.settings.key + '&method=flickr.photos.search&tags=' + escape(that.tags) + '&page=' + that.page + '&per_page=' + that.settings.photosPerPage + '&safe_search=' + that.settings.safeSearch + '&format=json&nojsoncallback=1',
				request = new XMLHttpRequest();

 		that.remove(resultsContainer);
 		that.remove(emptyPara);

		searchContainer.classList.add('loading');
		request.open('GET', url, true);
		request.send();
		request.onreadystatechange = function () {

			searchContainer.classList.remove('loading');
			try {
	    	if (request.readyState === 4) {
	      	if (request.status === 200) {

	      		var response = that.results = JSON.parse(request.responseText);

	      		if (response.stat === 'ok') {

	      			var resultsContainer = document.createElement('div');
	      			resultsContainer.id = 'results-container';

	      			if (response.photos.total === '0') {

	      				resultsContainer.innerHTML = '<p class="no-results">No results found</p>';
	      				searchContainer.appendChild(resultsContainer);

	      			} else {

			      		var	imageList = document.createElement('ul'),
			      				createGalleryLink = '<a href="#" id="create-gallery-button" class="button inactive">Show Gallery</a>',
			      				paginationLink = '<a href="#" id="paginate" class="button">Show more results</a>',
			      				instructions = document.createElement('p'),
			      				numResults,
			      				buttons,
			      				i,
			      				l;

			      		// move the search box out of the way
	      				searchContainer.style.paddingTop = 0;

	      				// When the container has moved (The CSS transition is set for 500ms)
	      				window.setTimeout(function () {
				      		imageList.classList.add('flickr-image-list');

				      		for (i = 0, l = response.photos.photo.length; i < l; i++) {
				      			var currentImg = response.photos.photo[i],
				      					li = document.createElement('li'),
				      					link = document.createElement('a'),
				      					img = that.createImage(currentImg, 'q', 'thumbnail-image', false);

				      			link.href = '#';
				      			link.appendChild(img);
				      			li.appendChild(link);
				      			imageList.appendChild(li).setAttribute('data-id', i);
				      		}

				      	 	instructions.classList.add('instructions');
				      	 	instructions.innerHTML = 'Select some images and click the <strong>Show Gallery</strong> button to create a slideshow gallery.';
				      	 	resultsContainer.appendChild(instructions);

				      	 	if (response.photos.pages > that.page) {
				      	 		buttons = createGalleryLink + '<span class="or">or</span>' + paginationLink;
				      	 	} else {
				      	 		buttons = createGalleryLink;
				      	 	}

				      		resultsContainer.appendChild(imageList).insertAdjacentHTML('afterend', buttons);
				      		searchContainer.appendChild(resultsContainer);

									var items = document.getElementsByClassName('flickr-image-list')[0].children,
											galleryLink = document.getElementById('create-gallery-button'),
											paginate = document.getElementById('paginate');

									for (i = 0, l = items.length; i < l; i++) {
										items[i].addEventListener('click', that.selectImages);
									}
									galleryLink.addEventListener('click', that.getGalleryImages);
									if (response.photos.pages > that.page) {
										paginate.addEventListener('click', that.paginate);
									}
									// Timer
								}, 500);
							}
						} else {
							resultsContainer.innerHTML = '<p class="no-results">Sorry, there was a problem with the Flickr API!</p>';
						}
	      	} else {
	        	resultsContainer.innerHTML = '<p class="no-results">Sorry, we\'re experiencing technical difficulties, please try again!</p>';
	      	}
	    	}
	  	}
	  	catch(e) {
		    console.log('Caught Exception: ' + e);
		    resultsContainer.innerHTML = '<p class="no-results">Sorry, we\'re experiencing technical difficulties, please try again!</p>';
		  }
  	};
	},

	/**
	 * View the next set of results
	 */
	paginate: function(e) {
		flickr.page++;
		flickr.sortSearch();
		e.preventDefault();
	},

	/**
	 * Create an image element from the Flickr JSON object
	 *
	 * @param object the current image object in the array
	 * @param string the size of the image to use. See - http://www.flickr.com/services/api/misc.urls.html
	 * @param string the class to add to the image
	 * @param string optional id for the image
	 *
	 * @return image element
	 */
	createImage: function(img, size, imgClass, i) {
		var image = document.createElement('img');
		if (i !== false) {
			image.id = 'id-' + i;
		}
		image.src = 'http://farm' + img.farm + '.staticflickr.com/' + img.server + '/' + img.id + '_' + img.secret + '_' + size + '.jpg';
		image.title = img.title;
		image.alt = img.title;
		image.classList.add(imgClass);
		return image;
	},

	/**
	 * Toggle a 'selected' state for images & for 'create slideshow' button
	 */
	selectImages: function(e) {
		var selectedImages = document.getElementsByClassName('selected-image'),
				createLink = document.getElementById('create-gallery-button');
		this.classList.toggle('selected-image');
		if (selectedImages.length > 0) {
			createLink.classList.remove('inactive');
		} else {
			createLink.classList.add('inactive');
		}
		e.preventDefault();
	},

	/**
	 * Create a gallery from user selected images
	 */
	getGalleryImages: function(e) {
		// If there are selected images, the 'inactive' class
		// on this link will have been removed
		if(this.classList.contains('inactive') === false) {
			var selectedImages = document.getElementsByClassName('selected-image'),
					hiddenImageContainer = document.getElementById('hidden-image-container'),
					l = selectedImages.length,
					i;

			flickr.remove(hiddenImageContainer);

			var hic = document.createElement('div');
			hic.id = 'hidden-image-container';

			// Reset the array of images for the gallery
			flickr.galleryImages = [];

			for (i = 0; i < l; i++) {
				var currentLi = selectedImages[i],
						id = currentLi.getAttribute('data-id'),
						currentImg = flickr.results.photos.photo[id],
						img = flickr.createImage(currentImg, 'z', 'hidden', id); // Create the full size image

				// Append the image to the DOM + hide it
				// (so that they'll load faster in the slideshow)
				hic.appendChild(img);
				flickr.galleryImages.push(id);
			}
			document.body.appendChild(hic);
			flickr.initializeSlideShow();
		}
		e.preventDefault();
	},


	/**
	 * Initialize the slideshow & add click handler to exit the show
	 */
	initializeSlideShow: function() {
		var that = this,
				container = document.createElement('div'),
				content = document.createElement('div');

		document.body.classList.add('slideshow-on');

		container.id = 'slideshow-container';
		container.style.height = document.height;
		content.id = 'slideshow-content';
		container.classList.add('loading');
		container.appendChild(content);
		document.body.appendChild(container);
		container.addEventListener('click', that.stopSlideShow);

		var firstId = 'id-' + flickr.galleryImages[0];
		firstImg = document.getElementById(firstId);
		// When the first image has loaded, initialize the show!
		firstImg.onload = function () {
			container.classList.remove('loading');
			that.slideShow();
		};
		window.document.onkeydown = function (e) {
		  if (e.keyCode == 27) {
		    that.stopSlideShow();
		  }
		}
	},

	/**
	 * Create a slidshow from seleted images
	 * Cycle through all selected images
	 */
	slideShow: function() {
		var that = this,
				container = document.getElementById('slideshow-container'),
				content = document.getElementById('slideshow-content'),
				winWidth = window.innerWidth,
				winHeight = window.innerHeight,
				currImg = (that.galleryImages.length === that.currentImageIndex) ? 0 : that.currentImageIndex,
				imgId = that.galleryImages[currImg],
				id = 'id-' + imgId,
				origImg = document.getElementById(id),
				img = origImg.cloneNode(),
				titleContainer = document.createElement('div'),
				leftPos,
				topPos;

		titleContainer.classList.add('title');
		titleContainer.innerHTML = '<span class="title-wrapper">' + img.title + '</span>';
		content.classList.remove('faded');

		if (typeof(container) == 'undefined' || container == null) {
			return;
		}

		that.currentImageIndex = currImg + 1;

		if (container.hasChildNodes()) {
			while (container.hasChildNodes()) {
		  	container.removeChild(container.lastChild);
			}
		}
		if (content.hasChildNodes()) {
			while (content.hasChildNodes()) {
				content.removeChild(content.lastChild);
			}
		}

		container.appendChild(content);
		content.appendChild(img);
		if (img.title !== '') {
			content.appendChild(titleContainer);
		}

		// If the image is taller than the viewport
		if (img.height >= winHeight) {
			img.height = winHeight - 40;
		}
		topPos = Math.ceil((winHeight / 2) - (img.height / 2)) + document.body.scrollTop;

		if (img.width >= winWidth) {
			leftPos = winWidth - 20;
		} else {
			leftPos = Math.ceil((winWidth / 2) - (img.width / 2));
		}
		content.style.left = leftPos;
		content.style.top = topPos;

		window.setTimeout( function () { content.classList.add('faded') }, 50);

		if (that.galleryImages.length > 1) {
			setTimeout(function () {
				if (document.body.classList.contains('slideshow-on')) {
					that.slideShow();
				}
			}, that.settings.timeout);
		}
	},

	/**
	 * Exits the slidshow, removes all appended elements from the DOM
	 */
	stopSlideShow: function(e) {
		var that = this,
				container = document.getElementById('slideshow-container'),
				thumbs = document.getElementsByClassName('flickr-image-list')[0].children,
				createLink = document.getElementById('create-gallery-button'),
				l = thumbs.length,
				i;

		if (typeof(container) != 'undefined' && container != null) {
			document.body.removeChild(container);
			document.body.classList.remove('slideshow-on');
			that.currentImageIndex = 0;
			that.galleryImages = [];
			createLink.classList.add('inactive');
			for (i = 0; i < l; i++) {
				var thisImage = thumbs[i];
				thisImage.classList.remove('selected-image');
			}
		}
	},

};

document.addEventListener("DOMContentLoaded", flickr.load);
