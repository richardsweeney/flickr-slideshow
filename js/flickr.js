var flickr = {
	settings: {
		username: 'mob_dev',
		password: 'asdfasdf',
		key: 'b54580f369a7eeebecb2004dc429d08f',
		secret: 'fdd9e176c2d2e4bb',
		photosPerPage: 30,
		url: 'http://api.flickr.com/services/rest/?',
		timeout: 3000
	},
	results: {},
	galleryImages: [],
	currentImageIndex: 0,

	/**
	 * Attach eventlistener to submit button when the DOM is ready
	 */
	load: function() {
		var submit = document.getElementById('flickr-submit');
		submit.addEventListener('click', flickr.sortSearch);
	},

	/**
	 * Get values from input + perform search query if not empty
	 */
	sortSearch: function(e) {
		var input = document.getElementById('flickr-input'),
				tags = input.value;
		if(tags === '') {
			alert('Please add a search term!');
			input.focus();
		} else {
			flickr.getResults(tags);
		}
		e.preventDefault();
	},

	/**
	 * Get results from flickr API via AJAX
	 *
	 * @param string a list of search terms
	 * Prints a list of returned results to the DOM
	 */
	getResults: function(tags) {
		var that = this,
				searchContainer = document.getElementsByClassName('search-container')[0],
				resultsContainer =  document.getElementById('results-container'),
				url = that.settings.url + 'api_key=' + that.settings.key + '&method=flickr.photos.search&tags=' + escape(tags) + '&per_page=' + that.settings.photosPerPage + '&format=json&nojsoncallback=1',
				request = new XMLHttpRequest();

		if (typeof(resultsContainer) != 'undefined' && resultsContainer != null) {
			resultsContainer.parentNode.removeChild(resultsContainer);
		}
		searchContainer.classList.add('loading');
		request.open('GET', url, true);
		request.send();
		request.onreadystatechange = logResults;

		function logResults () {
			searchContainer.classList.remove('loading');
			try {
	    	if (request.readyState === 4) {
	      	if (request.status === 200) {

	      		var response = that.results = JSON.parse(request.responseText);
	      		console.log(that.results);

	      		if (response.stat === 'ok') {

	      			var resultsContainer = document.createElement('div');
	      			resultsContainer.id = 'results-container';

	      			console.log(resultsContainer);

	      			if (response.photos.total === '0') {

	      				resultsContainer.innerHTML = '<p>No results found</p>';
	      				searchContainer.appendChild(resultsContainer);

	      			} else {

			      		var	imageList = document.createElement('ul'),
			      				createGalleryLink = '<a href="#" id="create-gallery-button" class="inactive">Create Gallery</a>',
			      				numResults,
			      				totalResponse = +response.photos.total,
			      				i;

			      		imageList.classList.add('flickr-image-list');
			      		numResults = ( that.settings.photosPerPage < totalResponse ) ? that.settings.photosPerPage : totalResponse;

			      		for (i = 0; i < numResults; i++) {

			      			var currentImg = response.photos.photo[i],
			      					li = document.createElement('li'),
			      					link = document.createElement('a'),
			      					img = that.createImage(currentImg, 'q', 'thumbnail-image', false);

			      			link.href = '#';
			      			link.appendChild(img);
			      			li.appendChild(link);
			      			imageList.appendChild(li).setAttribute('data-id', i);

			      		}

			      		resultsContainer.appendChild(imageList).insertAdjacentHTML('afterend', createGalleryLink);
			      		searchContainer.appendChild(resultsContainer);

								var items = document.getElementsByClassName('flickr-image-list')[0].children,
										galleryLink = document.getElementById('create-gallery-button'),
										l = items.length;
								for (i = 0; i < l; i++) {
									items[i].addEventListener('click', that.selectImages);
								}
								galleryLink.addEventListener('click', that.getGalleryImages);
							}
						} else {
							alert('There was a problem communicating with Flickr');
						}
	      	} else {
	        	alert('There was a problem with the request.');
	      	}
	    	}
	  	}
	  	catch( e ) {
		    alert('Caught Exception: ' + e.description);
		  }
  	};
	},

	/**
	 * Create an image element from returned Flickr JSON
	 *
	 * @param object the current image object in the array
	 * @param string the size of the image to use. See - http://www.flickr.com/services/api/misc.urls.html
	 * @param string the class to add to the image
	 * @param string optional id for the image
	 *
	 * @return an image element
	 */
	createImage: function(img, size, imgClass, i) {
		var image = new Image();
		if( i !== false ) {
			image.id = 'id-' + i;
		}
		image.src = 'http://farm' + img.farm + '.staticflickr.com/' + img.server + '/' + img.id + '_' + img.secret + '_' + size + '.jpg';
		image.title = img.title;
		image.alt = img.title;
		image.classList.add(imgClass);
		return image;
	},

	/**
	 * Toggle a 'selected' state for images + for 'create slideshow' button
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
					searchContainer = document.getElementsByClassName('search-container')[0],
					previousImages = document.getElementsByClassName('hidden'),
					hiddenImageContainer = document.getElementById('hidden-image-container'),
					selectedImageArray = [],
					l = selectedImages.length,
					pl = previousImages.length,
					images = '',
					i;

			if (typeof(hiddenImageContainer) != 'undefined' && hiddenImageContainer != null) {
				hiddenImageContainer.parentNode.removeChild(hiddenImageContainer);
			}
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
			flickr.initiateSlideShow();
			document.body.appendChild(hic);
		}

		e.preventDefault();
	},

	/**
	 * Initialize the slideshow: Append markup to the DOM
	 * + give the images a half-sec to preload
	 */
	initiateSlideShow: function() {
		var that = this,
				container = document.createElement('div'),
				content = document.createElement('div');

		container.id = 'slideshow-container';
		container.style.height = document.height;
		content.id = 'slideshow-content';
		container.appendChild(content);
		document.body.appendChild(container);

		container.addEventListener('click', that.stopSlideShow);

		setTimeout(function() {
			// Bit hackish, this give the images a change to preload
			that.slideShow();
		}, 500);

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
				currImg = (that.galleryImages.length === that.currentImageIndex + 1) ? 0 : that.currentImageIndex + 1,
				imgId = that.galleryImages[currImg],
				id = 'id-' + imgId,
				origImg = document.getElementById(id),
				img = origImg.cloneNode(),
				titleContainer = document.createElement('div'),
				leftPos,
				topPos;

		titleContainer.classList.add('title');
		titleContainer.innerHTML = '<span class="title-wrapper">' + img.title + '</span>';
		img.classList.remove('hidden');
		content.classList.remove('faded');

		if (typeof(container) == 'undefined' || container == null) {
			return;
		}

		that.currentImageIndex = currImg;

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
		content.appendChild(titleContainer);

		// If the image is taller than the viewport
		if (img.height >= winHeight) {
			img.height = winHeight - 40;
			console.log(img.height, img.width);
		}
		topPos = (Math.ceil((winHeight / 2) - (img.height / 2)) + document.body.scrollTop) - 10;

		if (img.width >= winWidth) {
			leftPos = winWidth - 20;
		} else {
			leftPos = Math.ceil((winWidth / 2) - (img.width / 2));
		}
		content.style.left = leftPos;
		content.style.top = topPos;

		window.setTimeout( function() { content.classList.add('faded') }, 50);

		setTimeout(function () {
			that.slideShow();
		}, that.settings.timeout);

	},

	/**
	 * Exits the slidshow, removes all appended elements from the DOM
	 */
	stopSlideShow: function(e) {
		var that = this,
				container = document.getElementById('slideshow-container'),
				thumbs = document.getElementsByClassName('flickr-image-list')[0].children,
				createLink = document.getElementById('create-gallery-button'),
				tl = thumbs.length,
				i;

		if (typeof(container) != 'undefined' && container != null) {
			document.body.removeChild(container);
			that.currentImageIndex = 0;
			that.galleryImages = [];
			createLink.classList.add('inactive');
			for (i = 0; i < tl; i++) {
				var thisImage = thumbs[i];
				thisImage.classList.remove('selected-image');
			}
		}
	},

};

document.addEventListener("DOMContentLoaded", flickr.load, false);
