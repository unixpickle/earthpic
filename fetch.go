package earthpic

import (
	"fmt"
	"image"
	_ "image/png"
	"net/http"
	"sync"
	"sync/atomic"
)

const numFetchGoroutines = 10
const disableEquatorLine = "&style=feature:administrative|element:geometry|visibility:off"

// FetchPixels uses Google Maps to fetch evenly spaced
// pixels of the Earth's surface.
// The latStep and lonStep arguments specify how many
// degrees to move between pixels.
// If apiKey is not the empty string, it will be used
// as an API key for the static maps API.
func FetchPixels(latStep, lonStep float64, apiKey string) (<-chan Pixel, <-chan error) {
	pixelChan := make(chan Pixel)
	errChan := make(chan error, 1)

	coordChan := make(chan [2]float64, (1+int(180/latStep))*(1+int(360/lonStep))+1)
	for lat := -90.0; lat <= 90; lat += latStep {
		for lon := -180.0; lon <= 180; lon += lonStep {
			coordChan <- [2]float64{lat, lon}
		}
	}
	close(coordChan)

	var wg sync.WaitGroup
	errVal := new(atomic.Value)
	for i := 0; i < numFetchGoroutines; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for coord := range coordChan {
				pixel, err := FetchPixel(coord[0], coord[1], apiKey)
				if err != nil {
					errVal.Store(err)
					return
				}
				pixelChan <- *pixel
			}
		}()
	}

	go func() {
		wg.Wait()
		if errVal.Load() != nil {
			errChan <- errVal.Load().(error)
		}
		close(errChan)
		close(pixelChan)
	}()

	return pixelChan, errChan
}

// FetchPixel fetches the pixel at the given latitude
// and longitude using Google Maps.
// If apiKey is not an empty string, the API key will
// be used for the API call.
func FetchPixel(lat, lon float64, apiKey string) (*Pixel, error) {
	url := fmt.Sprintf("http://maps.googleapis.com/maps/api/staticmap?center=%f,%f"+
		"&zoom=1&size=1x1&maptype=roadmap&sensor=false"+disableEquatorLine,
		lat, lon)
	if apiKey != "" {
		url += "&key=" + apiKey
	}
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	img, _, err := image.Decode(resp.Body)
	resp.Body.Close()
	if err != nil {
		return nil, err
	}
	if img.Bounds().Dx() != 1 || img.Bounds().Dy() != 1 {
		return nil, fmt.Errorf("coords %f,%f: unexpected dimensions: %dx%d",
			lat, lon, img.Bounds().Dx(), img.Bounds().Dy())
	}
	color := img.At(img.Bounds().Min.X, img.Bounds().Min.Y)
	r, g, b, _ := color.RGBA()
	return &Pixel{
		Lat: lat,
		Lon: lon,
		R:   float64(r) / 0xffff,
		G:   float64(g) / 0xffff,
		B:   float64(b) / 0xffff,
	}, nil
}
