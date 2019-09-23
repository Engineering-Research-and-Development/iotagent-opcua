#!/bin/bash

echo $(hostname -I | cut -d ' ' -f 1)