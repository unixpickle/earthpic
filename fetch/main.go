// Command fetch downloads an image of the Earth.
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"os"

	"github.com/unixpickle/earthpic"
)

var LatStep = flag.Float64("latstep", 1, "latitude step")
var LonStep = flag.Float64("lonstep", 1, "longitude step")

func main() {
	if len(os.Args) < 2 {
		dieUsage()
	}
	flag.Parse()
	if len(flag.Args()) != 1 {
		dieUsage()
	}

	pixelChan, errChan := earthpic.FetchPixels(*LatStep, *LonStep)
	var pic earthpic.Picture
	for pixel := range pixelChan {
		pic = append(pic, pixel)
	}
	if err := <-errChan; err != nil {
		fmt.Fprintln(os.Stderr, "Error fetching:", err)
		fmt.Fprintln(os.Stderr, "Saving partial results.")
	}

	outData, _ := json.Marshal(pic)
	if err := ioutil.WriteFile(flag.Args()[0], outData, 0755); err != nil {
		fmt.Fprintln(os.Stderr, "Error writing output:", err)
		os.Exit(1)
	}
}

func dieUsage() {
	fmt.Fprintln(os.Stderr, "Usage:", os.Args[0], "[flags] output.json\n\nFlags:")
	flag.PrintDefaults()
	fmt.Fprintln(os.Stderr)
	os.Exit(1)
}
